import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const LANG_LABELS: Record<string, string> = { en: 'English', kn: 'ಕನ್ನಡ', ta: 'தமிழ்', hi: 'हिन्दी' };

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  classes: Array<{ class_id: string; class_name: string }>; // for validation
  teacherId: string; // teachers.id (not users.id)
  stateId: string; // for user update linkage
  onImported?: () => void;
};

function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const cols = line.split(',');
    const row: Record<string, string> = {};
    headers.forEach((h, i) => row[h] = (cols[i] || '').trim());
    return row;
  });
}

function toE164Indian(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
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
  const [importing, setImporting] = useState(false);
  const [selectedLang, setSelectedLang] = useState(userProfile?.preferred_language || 'en');

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

  // Extract grade number from class name like "Class 9" → "9"
  const classIdToGrade = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of classes as any[]) {
      const id = String((c as any).class_id ?? (c as any).id ?? '');
      const name = String((c as any).class_name ?? (c as any).name ?? '');
      const match = name.match(/Class\s+(\d+)/i);
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
      normalized.push({ full_name: r.full_name, phone: normalizedPhone, class_id: classId });
    });
    setRows(normalized);
    setErrors(errs);
  };

  const downloadTemplate = () => {
    const csv = 'full_name,phone,class_name\n';
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
        preferredLanguage: selectedLang,
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

      const messages: string[] = [];
      if (result.created?.length > 0) {
        messages.push(`${result.created.length} student(s) imported successfully.`);
        // TEMP: remove in PR 2b when OTP activation is implemented
        for (const s of result.created) {
          messages.push(`${s.fullName} (${s.phone}) — temp password: ${s.tempPassword}`);
        }
      }
      if (result.errors?.length > 0) {
        for (const err of result.errors) {
          messages.push(`${err.fullName} (${err.phone}): ${err.reason}`);
        }
      }

      setErrors(messages);
      setImporting(false);

      if (result.created?.length > 0) {
        onImported?.();
      }
      if (!result.errors?.length) {
        onOpenChange(false);
      }
    } catch (e: any) {
      setErrors([`Import failed: ${e?.message || e}`]);
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Import Students (CSV)</DialogTitle>
          <DialogDescription>Columns: full_name, phone, class_name</DialogDescription>
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
            <pre className="bg-gray-50 border rounded p-2 mt-1 whitespace-pre-wrap">{`full_name,phone,class_name\nAsha Kumar,9876543210,Class 8\nRavi M,9876543211,Class 9`}</pre>
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
