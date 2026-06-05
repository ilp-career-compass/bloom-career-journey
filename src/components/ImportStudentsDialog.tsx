import React, { useMemo, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LANG_LABELS } from '@/lib/langLabels';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  classes: Array<{ class_id: string; class_name: string }>; // for validation
  teacherId: string; // teachers.id (not users.id)
  stateId: string; // for user update linkage
  onImported?: () => void;
};

function parseCSV(text: string): Array<Record<string, string>> {
  // RFC 4180-compliant parser — handles quoted fields containing commas and escaped quotes
  const rows: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i += 2; continue; }
      else if (ch === '"') { inQuotes = false; }
      else { field += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { current.push(field.trim()); field = ''; }
      else if (ch === '\n' || ch === '\r') {
        current.push(field.trim()); field = '';
        if (current.some(f => f)) rows.push(current);
        current = [];
        if (ch === '\r' && text[i + 1] === '\n') i++;
      } else { field += ch; }
    }
    i++;
  }
  if (field || current.length > 0) { current.push(field.trim()); if (current.some(f => f)) rows.push(current); }
  if (rows.length === 0) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).map(cols => {
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = (cols[idx] || '').trim(); });
    return row;
  });
}

function normalizeDigits(phone: string): string {
  return Array.from(phone)
    .map((ch) => {
      const n = ch.codePointAt(0) ?? NaN;
      if (n >= 0x30 && n <= 0x39) return ch; // ASCII digit fast-path
      const numericValue = Number(ch);
      if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 9) return String(numericValue);
      return ch;
    })
    .join('')
    .replace(/\D/g, '');
}

function toE164Indian(phone: string): string {
  const digits = normalizeDigits(phone);
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return phone;
}

function isValidE164(phone: string): boolean {
  return /^\+91\d{10}$/.test(phone) || /^\d{10}$/.test(phone);
}

export default function ImportStudentsDialog({ open, onOpenChange, classes, teacherId, stateId, onImported }: Props) {
  const { userProfile } = useAuth();
  const [rows, setRows] = useState<Array<Record<string, string>>>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [successes, setSuccesses] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [selectedLang, setSelectedLang] = useState(userProfile?.preferred_language || 'en');

  // Reset all state when dialog closes so re-opening is always fresh
  useEffect(() => {
    if (!open) {
      setRows([]);
      setErrors([]);
      setSuccesses([]);
    }
  }, [open]);

  const classMap = useMemo(() => {
    const pairs: Array<[string, string]> = [];
    for (const c of classes as any[]) {
      const id = String((c as any).class_id ?? (c as any).id ?? '');
      const name = String((c as any).class_name ?? (c as any).name ?? '');
      if (id && name) pairs.push([id, name]);
    }
    return new Map(pairs);
  }, [classes]);
  const nameToId = useMemo(() => {
    const pairs: Array<[string, string]> = [];
    for (const c of classes as any[]) {
      const id = String((c as any).class_id ?? (c as any).id ?? '');
      const name = String((c as any).class_name ?? (c as any).name ?? '');
      if (id && name) pairs.push([name.toLowerCase(), id]);
    }
    return new Map(pairs);
  }, [classes]);

  // Extract grade number from class name — handles "Class 9", "Grade 9", "9th Standard", "9", etc.
  const classIdToGrade = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of classes as any[]) {
      const id = String((c as any).class_id ?? (c as any).id ?? '');
      const name = String((c as any).class_name ?? (c as any).name ?? '');
      const match = name.match(/(\d+)/);
      if (id && match) map.set(id, match[1]);
    }
    return map;
  }, [classes]);

  const onFile = async (file: File) => {
    const text = await file.text();
    const parsed = parseCSV(text);
    const errs: string[] = [];
    const normalized: Array<Record<string,string>> = [];
    parsed.forEach((r, idx) => {
      if (!r.full_name) { errs.push(`Row ${idx+2}: missing full_name`); return; }
      if (!r.phone) { errs.push(`Row ${idx+2}: missing phone`); return; }
      const normalizedPhone = toE164Indian(r.phone.trim());
      if (!isValidE164(normalizedPhone)) { errs.push(`Row ${idx+2}: invalid phone "${r.phone}" — expected 10-digit mobile number`); return; }
      // accept class_id or class_name
      let classId = r.class_id?.trim();
      if (!classId) {
        const className = (r.class_name || '').toLowerCase();
        classId = nameToId.get(className) || '';
      }
      if (!classId || !classMap.has(classId)) { errs.push(`Row ${idx+2}: invalid class (provide class_id or class_name)`); return; }
      const rowLang = r.preferred_language?.trim();
      const lang = rowLang && LANG_LABELS[rowLang] ? rowLang : '';
      normalized.push({ full_name: r.full_name, phone: normalizedPhone, class_id: classId, preferred_language: lang });
    });
    setRows(normalized);
    setErrors(errs);
  };

  const downloadTemplate = () => {
    const csv = 'full_name,phone,class_name,preferred_language\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'students_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };


  const doImport = async () => {
    if (rows.length === 0) return;
    setImporting(true);

    try {
      // Build the students array for the Edge Function
      const students = rows.map(r => ({
        fullName: r.full_name,
        phone: r.phone,
        grade: classIdToGrade.get(r.class_id) || '',
        preferredLanguage: r.preferred_language || selectedLang,
        teacherId,
        stateId,
      }));

      const { data: result, error: fnError } = await supabase.functions.invoke('create-student', {
        body: { students, teacherUserId: userProfile?.id },
      });

      if (fnError) {
        setErrors([`Import failed: ${fnError.message}`]);
        setImporting(false);
        return;
      }

      const successMessages: string[] = [];
      const errorMessages: string[] = [];
      if (result.created?.length > 0) {
        successMessages.push(`${result.created.length} student(s) imported successfully.`);
      }
      if (result.errors?.length > 0) {
        for (const err of result.errors) {
          errorMessages.push(`${err.fullName} (${err.phone}): ${err.reason}`);
        }
      }

      setSuccesses(successMessages);
      setErrors(errorMessages);
      setImporting(false);

      if (result.created?.length > 0) {
        onImported?.();
      }
      if (!result.errors?.length) {
        onOpenChange(false);
      }
    } catch (e: any) {
      setErrors([`Import failed: ${e?.message || e}`]);
      setSuccesses([]);
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Import Students (CSV)</DialogTitle>
          <DialogDescription>Required: full_name, phone, class_name — Optional: preferred_language (en/kn/ta/hi)</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadTemplate}>Download Template</Button>
            <label className="inline-flex items-center gap-2">
              <input type="file" accept=".csv" onChange={(e)=> e.target.files && onFile(e.target.files[0])} />
            </label>
          </div>
          <div className="text-xs text-gray-500">
            Example (CSV):
            <pre className="bg-gray-50 border rounded p-2 mt-1 whitespace-pre-wrap">{`full_name,phone,class_name,preferred_language\nAsha Kumar,9876543210,Class 8,kn\nRavi M,9876543211,Class 9,`}</pre>
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Preferred Language for all students</Label>
            <Select value={selectedLang} onValueChange={setSelectedLang}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LANG_LABELS).map(([code, label]) => (
                  <SelectItem key={code} value={code}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {rows.length > 0 && (
            <div className="text-sm text-gray-700">Ready to import: {rows.length} rows</div>
          )}
          {successes.length > 0 && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2 whitespace-pre-wrap">{successes.join('\n')}</div>
          )}
          {errors.length > 0 && (
            <div className="text-sm text-red-600 whitespace-pre-wrap">{errors.join('\n')}</div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={()=> onOpenChange(false)}>Close</Button>
            <Button onClick={doImport} disabled={importing || rows.length===0} className="bg-green-600 hover:bg-green-700">{importing ? 'Importing…' : 'Import'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
