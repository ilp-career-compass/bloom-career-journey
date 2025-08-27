import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  classes: Array<{ class_id: string; class_name: string }>; // for validation
  teacherId: string; // teachers.id (not users.id)
  schoolId: string; // for user update linkage
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

export default function ImportStudentsDialog({ open, onOpenChange, classes, teacherId, schoolId, onImported }: Props) {
  const { userProfile } = useAuth();
  const [rows, setRows] = useState<Array<Record<string, string>>>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const classMap = useMemo(() => new Map(classes.map(c => [c.class_id, c.class_name])), [classes]);
  const nameToId = useMemo(() => new Map(classes.map(c => [c.class_name.toLowerCase(), c.class_id])), [classes]);

  const onFile = async (file: File) => {
    const text = await file.text();
    const parsed = parseCSV(text);
    const errs: string[] = [];
    const normalized: Array<Record<string,string>> = [];
    parsed.forEach((r, idx) => {
      if (!r.full_name) { errs.push(`Row ${idx+2}: missing full_name`); return; }
      if (!r.contact) { errs.push(`Row ${idx+2}: missing contact`); return; }
      // accept class_id or class_name
      let classId = r.class_id?.trim();
      if (!classId) {
        const className = (r.class_name || '').toLowerCase();
        classId = nameToId.get(className) || '';
      }
      if (!classId || !classMap.has(classId)) { errs.push(`Row ${idx+2}: invalid class (provide class_id or class_name)`); return; }
      normalized.push({ full_name: r.full_name, contact: r.contact, class_id: classId });
    });
    setRows(normalized);
    setErrors(errs);
  };

  const downloadTemplate = () => {
    const csv = 'full_name,contact,class_name\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'students_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };


  const doImport = async () => {
    if (rows.length === 0) return;
    setImporting(true);
    const failed: string[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const isEmail = /@/.test(r.contact);
        const { data: userData, error: userErr } = await supabase.auth.admin.createUser({
          email: isEmail ? r.contact : undefined,
          phone: !isEmail ? r.contact : undefined,
          password: 'temporary123',
          email_confirm: isEmail ? true : undefined,
          phone_confirm: !isEmail ? true : undefined,
          user_metadata: { full_name: r.full_name, role: 'student' }
        });
        if (userErr || !userData?.user) throw userErr || new Error('createUser failed');

        const { error: updErr } = await supabase
          .from('users')
          .update({ school_id: schoolId, email: isEmail ? r.contact : null, mobile: !isEmail ? r.contact : null })
          .eq('id', userData.user.id);
        if (updErr) throw updErr;

        const { error: sErr } = await supabase
          .from('students')
          .insert({ user_id: userData.user.id, teacher_id: teacherId, class_id: r.class_id, enrollment_status: 'active' });
        if (sErr) throw sErr;
      } catch (e: any) {
        failed.push(`Row ${i+2}: ${e?.message || e}`);
      }
    }
    setImporting(false);
    if (failed.length > 0) {
      setErrors(failed);
    } else {
      onOpenChange(false);
      onImported?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Import Students (CSV)</DialogTitle>
          <DialogDescription>Columns: full_name, contact, class_name</DialogDescription>
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
            <pre className="bg-gray-50 border rounded p-2 mt-1 whitespace-pre-wrap">{`full_name,contact,class_name\nAsha Kumar,asha@example.com,Class 8\nRavi M,+919876543210,Class 9`}</pre>
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


