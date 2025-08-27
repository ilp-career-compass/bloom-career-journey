import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export default function ProfileDialog({ open, onOpenChange }: Props) {
  const { userProfile } = useAuth();
  const isTeacher = userProfile?.role === 'teacher';

  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [goal, setGoal] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [meta, setMeta] = useState<{ email?: string | null; mobile?: string | null; school?: string; className?: string; teacher?: string }>();

  useEffect(() => {
    if (!userProfile?.id) return;
    setFullName(userProfile.full_name || '');
    setGender((userProfile as any).gender || '');
    setGoal((userProfile as any).career_goals || '');
    // Load school/class/teacher labels and contact
    (async () => {
      try {
        const studentRes = await supabase
          .from('students')
          .select('class_id, classes(name, schools(name)), teachers( users:users(full_name) )')
          .eq('user_id', userProfile.id)
          .maybeSingle();
        const teacherRes = await supabase
          .from('teachers')
          .select('school_id, schools(name)')
          .eq('user_id', userProfile.id)
          .maybeSingle();
        setMeta({
          email: (userProfile as any).email || null,
          mobile: (userProfile as any).mobile || null,
          school: studentRes.data?.classes?.schools?.name || teacherRes.data?.schools?.name || '',
          className: studentRes.data?.classes?.name || '',
          teacher: (studentRes.data as any)?.teachers?.users?.full_name || '',
        });
      } catch (e) {}
    })();
  }, [userProfile?.id]);

  const contactLabel = useMemo(() => meta?.email || meta?.mobile || '', [meta]);

  const saveProfile = async () => {
    if (!userProfile?.id) return;
    setSaving(true);
    try {
      // avatar upload
      let avatarUrl = (userProfile as any).profile_picture_url || null;
      if (avatarFile) {
        const path = `${userProfile.id}/${Date.now()}_${avatarFile.name}`;
        const { error: upErr } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        avatarUrl = data.publicUrl;
      }
      // update users row
      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName, gender: gender || null, career_goals: isTeacher ? (userProfile as any).career_goals || null : goal || null, profile_picture_url: avatarUrl })
        .eq('id', userProfile.id);
      if (error) throw error;
      // password change
      if (password) {
        const { error: pwErr } = await supabase.auth.updateUser({ password });
        if (pwErr) throw pwErr;
      }
      onOpenChange(false);
    } catch (err) {
      console.error('Profile save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>My Profile</DialogTitle>
          <DialogDescription>Update your profile information</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input value={fullName} onChange={(e)=> setFullName(e.target.value)} />
          </div>
          <div>
            <Label>Phone / Email</Label>
            <Input value={contactLabel} disabled />
          </div>
          {!isTeacher && (
            <div>
              <Label>Gender</Label>
              <Select value={gender} onValueChange={(v: any)=> setGender(v)}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {/* View-only labels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>School</Label>
              <Input value={meta?.school || ''} disabled />
            </div>
            {!isTeacher && (
              <>
                <div>
                  <Label>Class</Label>
                  <Input value={meta?.className || ''} disabled />
                </div>
                <div>
                  <Label>Teacher</Label>
                  <Input value={meta?.teacher || ''} disabled />
                </div>
              </>
            )}
          </div>
          {!isTeacher && (
            <div>
              <Label>Aspiration / Career Goal</Label>
              <Input value={goal} onChange={(e)=> setGoal(e.target.value)} placeholder="Your career goal" />
            </div>
          )}
          <div>
            <Label>Profile Picture</Label>
            <Input type="file" accept="image/*" onChange={(e)=> setAvatarFile(e.target.files?.[0] || null)} />
          </div>
          <div>
            <Label>Change Password</Label>
            <Input type="password" value={password} onChange={(e)=> setPassword(e.target.value)} placeholder="New password" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={()=> onOpenChange(false)}>Close</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={saveProfile} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


