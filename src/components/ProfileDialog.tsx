import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLang } from '@/hooks/useLang';
import { KannadaKeyboard } from '@/components/ui/KannadaKeyboard';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export default function ProfileDialog({ open, onOpenChange }: Props) {
  const { userProfile, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const { t, lang } = useLang();
  const isTeacher = userProfile?.role === 'teacher';

  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [goal, setGoal] = useState('');
  const [school, setSchool] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [meta, setMeta] = useState<{ email?: string | null; mobile?: string | null; state?: string; className?: string; teacherName?: string }>();

  useEffect(() => {
    if (!userProfile?.id) return;
    console.log('🔄 ProfileDialog: Loading user profile data:', userProfile);
    setFullName(userProfile.full_name || '');
    setGender((userProfile as any).gender || '');
    setGoal((userProfile as any).career_goals || '');
    setSchool((userProfile as any).school || '');
    // Load state label and contact
    (async () => {
      try {
        const studentRes = await supabase
          .from('students')
          .select('class_id, classes(name, states(state_name)), teachers:teacher_id(users:user_id(full_name))')
          .eq('user_id', userProfile.id)
          .maybeSingle();
        const teacherRes = await supabase
          .from('teachers')
          .select('state_id, class_id, states(state_name), classes(name)')
          .eq('user_id', userProfile.id)
          .maybeSingle();
        const userStateRes = await supabase
          .from('users')
          .select('state_id, states(state_name)')
          .eq('id', userProfile.id)
          .maybeSingle();
        setMeta({
          email: (userProfile as any).email || null,
          mobile: (userProfile as any).mobile || null,
          state:
            studentRes.data?.classes?.states?.state_name ||
            teacherRes.data?.states?.state_name ||
            (userStateRes.data as any)?.states?.state_name ||
            '',
          className: studentRes.data?.classes?.name || teacherRes.data?.classes?.name || '',
          teacherName: (studentRes.data as any)?.teachers?.users?.full_name || '',
        });
      } catch (e) {
        // swallow optional meta fetch errors
      }
    })();
  }, [userProfile?.id, userProfile?.full_name, userProfile?.gender, userProfile?.school, userProfile?.career_goals, userProfile?.profile_picture_url]);

  const contactLabel = useMemo(() => meta?.email || meta?.mobile || '', [meta]);

  // Refresh profile data when dialog opens
  useEffect(() => {
    if (open && userProfile?.id) {
      console.log('🔄 ProfileDialog opened - refreshing profile data');
      refreshUserProfile();
    }
  }, [open, userProfile?.id]);

  const saveProfile = async () => {
    if (!userProfile?.id) return;
    setSaving(true);
    try {
      // avatar upload
      let avatarUrl = (userProfile as any).profile_picture_url || null;
      if (avatarFile) {
        try {
          // Verify user is authenticated and get auth.uid()
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (!authUser) {
            throw new Error('User not authenticated. Please log in again.');
          }

          // Use auth.uid() for the path to ensure it matches the RLS policy
          const userId = authUser.id;
          const path = `${userId}/${Date.now()}_${avatarFile.name}`;

          console.log('📤 Uploading profile picture:', {
            path,
            userId,
            userProfileId: userProfile.id,
            fileSize: avatarFile.size,
            fileName: avatarFile.name,
            fileType: avatarFile.type
          });

          const { error: upErr } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true });
          if (upErr) {
            console.error('❌ Avatar upload error:', upErr);
            if (upErr.message?.includes('Bucket not found') || upErr.message?.includes('does not exist')) {
              throw new Error('Storage bucket "avatars" not found. Please run the database migration (20251112000002_ensure_avatars_bucket_exists.sql) or contact your administrator to set up file storage.');
            }
            if (upErr.message?.includes('row-level security policy') || upErr.message?.includes('RLS') || upErr.message?.includes('new row violates')) {
              console.error('🔒 RLS Policy Error Details:', {
                userId,
                userProfileId: userProfile.id,
                path,
                authUid: authUser.id,
                match: userId === authUser.id,
                errorMessage: upErr.message
              });
              throw new Error('Permission denied. The storage bucket exists but you don\'t have permission to upload. Please ensure you are logged in and try again, or contact support.');
            }
            throw upErr;
          }

          console.log('✅ Avatar uploaded successfully');
          const { data } = supabase.storage.from('avatars').getPublicUrl(path);
          avatarUrl = data.publicUrl;
        } catch (uploadError) {
          console.error('❌ Avatar upload failed:', uploadError);
          throw new Error(`Failed to upload profile picture: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
      }
      // update users row
      const updateData = {
        full_name: fullName,
        gender: gender || null,
        school: school || null,
        profile_picture_url: avatarUrl,
        career_goals: isTeacher ? (userProfile as any).career_goals || null : goal || null
      };

      console.log('🔄 Updating user profile with data:', updateData);

      const { data: updateResult, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userProfile.id)
        .select();

      if (error) {
        console.error('❌ Database update error:', error);
        throw error;
      }

      console.log('✅ Database update successful:', updateResult);
      // password change
      if (password) {
        if (!isTeacher) {
          // Custom-auth students: update student_auth_credentials
          console.log('Updating student password for user:', userProfile.id);

          const { error: credErr } = await supabase
            .from('student_auth_credentials')
            .update({
              password_hash: password,
              is_active: true
            })
            .eq('user_id', userProfile.id);

          if (credErr) {
            console.error('Password update error:', credErr);
            throw new Error(`Failed to update password: ${credErr.message}`);
          }

          console.log('Student password updated successfully');
          toast({
            title: lang === 'kn' ? "ಪಾಸ್ವರ್ಡ್ ನವೀಕರಿಸಲಾಗಿದೆ! 🔐" : lang === 'ta' ? "கடவுச்சொல் மாற்றப்பட்டது! 🔐" : "Password Updated! 🔐",
            description: lang === 'kn' ? "ನಿಮ್ಮ ಪಾಸ್ವರ್ಡ್ ಯಶಸ್ವಿಯಾಗಿ ಬದಲಾಯಿಸಲಾಗಿದೆ. ಈಗ ನೀವು ನಿಮ್ಮ ಹೊಸ ಪಾಸ್ವರ್ಡ್‌ನೊಂದಿಗೆ ಲಾಗಿನ್ ಮಾಡಬಹುದು." : lang === 'ta' ? "உங்கள் கடவுச்சொல் மாற்றப்பட்டது. இப்போது புதிய கடவுச்சொல்லுடன் நுழையலாம்." : "Your password has been changed successfully. You can now login with your new password.",
          });
        } else {
          // Supabase-auth users (teachers/admins)
          const { error: pwErr } = await supabase.auth.updateUser({ password });
          if (pwErr) {
            console.error('Password update error:', pwErr);
            throw new Error(`Failed to update password: ${pwErr.message}`);
          }
          toast({
            title: lang === 'kn' ? "ಪಾಸ್ವರ್ಡ್ ನವೀಕರಿಸಲಾಗಿದೆ! 🔐" : lang === 'ta' ? "கடவுச்சொல் மாற்றப்பட்டது! 🔐" : "Password Updated! 🔐",
            description: lang === 'kn' ? "ನಿಮ್ಮ ಪಾಸ್ವರ್ಡ್ ಯಶಸ್ವಿಯಾಗಿ ಬದಲಾಯಿಸಲಾಗಿದೆ." : lang === 'ta' ? "உங்கள் கடவுச்சொல் மாற்றப்பட்டது." : "Your password has been changed successfully.",
          });
        }
      }

      // Show success message
      toast({
        title: lang === 'kn' ? "ಪ್ರೊಫೈಲ್ ನವೀಕರಿಸಲಾಗಿದೆ! ✨" : lang === 'ta' ? "சுயவிவரம் மாற்றப்பட்டது! ✨" : "Profile Updated! ✨",
        description: lang === 'kn' ? "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ." : lang === 'ta' ? "உங்கள் சுயவிவரம் மாற்றப்பட்டது." : "Your profile has been updated successfully.",
      });

      // Small delay to ensure database update is complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Refresh user profile to show updated picture
      console.log('🔄 Refreshing user profile after update...');
      await refreshUserProfile();

      // Force re-render of profile dialog with fresh data
      console.log('🔄 Profile dialog will re-render with fresh data');

      onOpenChange(false);
    } catch (err: any) {
      console.error('Profile save error:', err);

      const rawMessage = (err && err.message ? String(err.message) : '').toLowerCase();
      let description: string;

      if (rawMessage.includes('avatars') && rawMessage.includes('bucket')) {
        // Storage bucket missing
        description =
          lang === 'kn'
            ? 'ಪ್ರೊಫೈಲ್ ಚಿತ್ರವನ್ನು ಈಗ ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿರ್ವಾಹಕರು "avatars" ಸ್ಟೋರೇಜ್ ಬಕೆಟ್ ಅನ್ನು ಸೃಷ್ಟಿಸಲಿ.'
            : lang === 'ta'
              ? 'சுயவிவர படத்தை இப்போது பதிவேற்ற முடியவில்லை. நிர்வாகி "avatars" சேமிப்பு பக்கெட்டை உருவாக்க வேண்டும்.'
              : 'We cannot upload your profile picture right now. Please ask your administrator to create the "avatars" storage bucket.';
      } else {
        description =
          lang === 'kn'
            ? 'ಪ್ರೊಫೈಲ್ ಅನ್ನು ನವೀಕರಿಸಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'
            : lang === 'ta'
              ? 'சுயவிவரத்தை மாற்ற முடியவில்லை. தயவு செய்து மீண்டும் முயற்சிக்கவும்.'
              : 'Failed to update profile. Please try again.';
      }

      toast({
        title: lang === 'kn' ? "ನವೀಕರಣ ವಿಫಲವಾಗಿದೆ" : lang === 'ta' ? "மாற்ற முடியவில்லை" : "Update Failed",
        description,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl" lang={lang} dir="auto">
        <DialogHeader>
          <DialogTitle>{lang === 'kn' ? 'ನನ್ನ ಪ್ರೊಫೈಲ್' : lang === 'ta' ? 'என் விவரம்' : 'My Profile'}</DialogTitle>
          <DialogDescription>{lang === 'kn' ? 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಮಾಹಿತಿಯನ್ನು ನವೀಕರಿಸಿ' : lang === 'ta' ? 'உங்கள் விவரத்தை மாற்றவும்' : 'Update your profile information'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{lang === 'kn' ? 'ಪೂರ್ಣ ಹೆಸರು' : lang === 'ta' ? 'முழு பெயர்' : 'Full Name'}</Label>
            <Input
              lang={lang}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div>
            <Label>{lang === 'kn' ? 'ಫೋನ್ / ಇಮೇಲ್' : lang === 'ta' ? 'தொலைபேசி / மின்னஞ்சல்' : 'Phone / Email'}</Label>
            <Input value={contactLabel} disabled />
          </div>
          <div>
            <Label>{lang === 'kn' ? 'ಲಿಂಗ' : lang === 'ta' ? 'பாலினம்' : 'Gender'}</Label>
            <Select value={gender} onValueChange={(v: any) => setGender(v)}>
              <SelectTrigger><SelectValue placeholder={lang === 'kn' ? 'ಲಿಂಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ' : lang === 'ta' ? 'பாலினத்தைத் தேர்ந்தெடுக்கவும்' : 'Select gender'} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{lang === 'kn' ? 'ಪುರುಷ' : lang === 'ta' ? 'ஆண்' : 'Male'}</SelectItem>
                <SelectItem value="female">{lang === 'kn' ? 'ಸ್ತ್ರೀ' : lang === 'ta' ? 'பெண்' : 'Female'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* State and School - Side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>{lang === 'kn' ? 'ರಾಜ್ಯ' : lang === 'ta' ? 'மாநிலம்' : 'State'}</Label>
              <Input value={meta?.state || ''} disabled />
            </div>
            <div>
              <Label>{lang === 'kn' ? 'ಶಾಲೆ' : lang === 'ta' ? 'பள்ளி' : 'School'}</Label>
              <Input
                lang={lang}
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder={lang === 'kn' ? 'ನಿಮ್ಮ ಶಾಲೆಯ ಹೆಸರನ್ನು ನಮೂದಿಸಿ' : lang === 'ta' ? 'உங்கள் பள்ளியின் பெயரை உள்ளிடவும்' : 'Enter your school name'}
              />
            </div>
          </div>
          {!isTeacher && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>{lang === 'kn' ? 'ಶಿಕ್ಷಕ' : lang === 'ta' ? 'ஆசிரியர்' : 'Teacher'}</Label>
                <Input value={meta?.teacherName || ''} disabled />
              </div>
              <div>
                <Label>{lang === 'kn' ? 'ತರಗತಿ' : lang === 'ta' ? 'வகுப்பு' : 'Class'}</Label>
                <Input value={meta?.className || ''} disabled />
              </div>
            </div>
          )}
          {!isTeacher && (
            <div>
              <Label>{lang === 'kn' ? 'ಆಸೆ / ವೃತ್ತಿ ಗುರಿ' : lang === 'ta' ? 'ஆசை / வாழ்க்கை இலக்கு' : 'Aspiration / Career Goal'}</Label>
              <Input
                lang={lang}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder={lang === 'kn' ? 'ನಿಮ್ಮ ವೃತ್ತಿ ಗುರಿ' : lang === 'ta' ? 'உங்கள் வாழ்க்கை இலக்கு' : 'Your career goal'}
              />
            </div>
          )}
          <div>
            <Label>{lang === 'kn' ? 'ಆಯ್ಕೆ ಮಾಡಿದ ಭಾಷೆ' : lang === 'ta' ? 'தேர்ந்தெடுக்கப்பட்ட மொழி' : 'Preferred Language'}</Label>
            <Input
              value={userProfile?.preferred_language === 'kn' ? (lang === 'kn' ? 'ಕನ್ನಡ' : 'Kannada') :
                userProfile?.preferred_language === 'ta' ? (lang === 'ta' ? 'தமிழ்' : 'Tamil') :
                  'English'}
              disabled
              className="bg-slate-50 opacity-80"
            />
          </div>
          <div>
            <Label>{lang === 'kn' ? 'ಪ್ರೊಫೈಲ್ ಚಿತ್ರ' : lang === 'ta' ? 'படம்' : 'Profile Picture'}</Label>
            <Input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
          </div>
          <div>
            <Label>{lang === 'kn' ? 'ಪಾಸ್ವರ್ಡ್ ಬದಲಾಯಿಸಿ' : lang === 'ta' ? 'கடவுச்சொல் மாற்ற' : 'Change Password'}</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={lang === 'kn' ? 'ಹೊಸ ಪಾಸ್ವರ್ಡ್' : lang === 'ta' ? 'புதிய கடவுச்சொல்' : 'New password'}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {lang === 'kn' ? 'ಮುಚ್ಚಿ' : lang === 'ta' ? 'மூடு' : 'Close'}
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={saveProfile} disabled={saving}>
              {saving ? (lang === 'kn' ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ…' : lang === 'ta' ? 'சேமிக்கிறது…' : 'Saving…') : (lang === 'kn' ? 'ಉಳಿಸಿ' : lang === 'ta' ? 'சேமி' : 'Save')}
            </Button>
          </div>
        </div>
        {(lang === 'kn' || lang === 'ta') && <KannadaKeyboard lang={lang} />}
      </DialogContent>
    </Dialog >
  );
}


