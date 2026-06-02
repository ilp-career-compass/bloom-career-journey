import { logger } from '@/lib/logger';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLang } from '@/hooks/useLang';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

const PD: Record<'en' | 'kn' | 'ta' | 'hi', Record<string, string>> = {
  en: {
    profileTitle: 'My Profile',
    profileDesc: 'Update your profile information',
    profileUpdated: 'Profile Updated! ✨',
    profileUpdatedDesc: 'Your profile has been updated successfully.',
    updateFailed: 'Update Failed',
    updateFailedDesc: 'Failed to update profile. Please try again.',
    avatarBucketError: 'We cannot upload your profile picture right now. Please ask your administrator to create the "avatars" storage bucket.',
    labelFullName: 'Full Name',
    labelPhoneEmail: 'Phone / Email',
    labelGender: 'Gender',
    selectGender: 'Select gender',
    genderMale: 'Male',
    genderFemale: 'Female',
    labelState: 'State',
    labelSchool: 'School',
    placeholderSchool: 'Enter your school name',
    labelTeacher: 'Teacher',
    labelClass: 'Class',
    labelAspiration: 'Aspiration / Career Goal',
    placeholderAspiration: 'Your career goal',
    labelPreferredLang: 'Preferred Language',
    labelProfilePicture: 'Profile Picture',
    labelChangePassword: 'Change Password',
    placeholderNewPassword: 'New password',
    btnClose: 'Close',
    btnSave: 'Save',
    btnSaving: 'Saving…',
    langUpdated: 'Language updated',
  },
  kn: {
    profileTitle: 'ನನ್ನ ಪ್ರೊಫೈಲ್',
    profileDesc: 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಮಾಹಿತಿಯನ್ನು ನವೀಕರಿಸಿ',
    profileUpdated: 'ಪ್ರೊಫೈಲ್ ನವೀಕರಿಸಲಾಗಿದೆ! ✨',
    profileUpdatedDesc: 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ.',
    updateFailed: 'ನವೀಕರಣ ವಿಫಲವಾಗಿದೆ',
    updateFailedDesc: 'ಪ್ರೊಫೈಲ್ ಅನ್ನು ನವೀಕರಿಸಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
    avatarBucketError: 'ಪ್ರೊಫೈಲ್ ಚಿತ್ರವನ್ನು ಈಗ ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿರ್ವಾಹಕರು "avatars" ಸ್ಟೋರೇಜ್ ಬಕೆಟ್ ಅನ್ನು ಸೃಷ್ಟಿಸಲಿ.',
    labelFullName: 'ಪೂರ್ಣ ಹೆಸರು',
    labelPhoneEmail: 'ಫೋನ್ / ಇಮೇಲ್',
    labelGender: 'ಲಿಂಗ',
    selectGender: 'ಲಿಂಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    genderMale: 'ಪುರುಷ',
    genderFemale: 'ಸ್ತ್ರೀ',
    labelState: 'ರಾಜ್ಯ',
    labelSchool: 'ಶಾಲೆ',
    placeholderSchool: 'ನಿಮ್ಮ ಶಾಲೆಯ ಹೆಸರನ್ನು ನಮೂದಿಸಿ',
    labelTeacher: 'ಶಿಕ್ಷಕ',
    labelClass: 'ತರಗತಿ',
    labelAspiration: 'ಆಸೆ / ವೃತ್ತಿ ಗುರಿ',
    placeholderAspiration: 'ನಿಮ್ಮ ವೃತ್ತಿ ಗುರಿ',
    labelPreferredLang: 'ಆಯ್ಕೆ ಮಾಡಿದ ಭಾಷೆ',
    labelProfilePicture: 'ಪ್ರೊಫೈಲ್ ಚಿತ್ರ',
    labelChangePassword: 'ಪಾಸ್ವರ್ಡ್ ಬದಲಾಯಿಸಿ',
    placeholderNewPassword: 'ಹೊಸ ಪಾಸ್ವರ್ಡ್',
    btnClose: 'ಮುಚ್ಚಿ',
    btnSave: 'ಉಳಿಸಿ',
    btnSaving: 'ಉಳಿಸಲಾಗುತ್ತಿದೆ…',
    langUpdated: 'ಭಾಷೆ ನವೀಕರಿಸಲಾಗಿದೆ',
  },
  ta: {
    profileTitle: 'என் விவரம்',
    profileDesc: 'உங்கள் விவரத்தை மாற்றவும்',
    profileUpdated: 'சுயவிவரம் மாற்றப்பட்டது! ✨',
    profileUpdatedDesc: 'உங்கள் சுயவிவரம் மாற்றப்பட்டது.',
    updateFailed: 'மாற்ற முடியவில்லை',
    updateFailedDesc: 'சுயவிவரத்தை மாற்ற முடியவில்லை. தயவு செய்து மீண்டும் முயற்சிக்கவும்.',
    avatarBucketError: 'சுயவிவர படத்தை இப்போது பதிவேற்ற முடியவில்லை. நிர்வாகி "avatars" சேமிப்பு பக்கெட்டை உருவாக்க வேண்டும்.',
    labelFullName: 'முழு பெயர்',
    labelPhoneEmail: 'தொலைபேசி / மின்னஞ்சல்',
    labelGender: 'பாலினம்',
    selectGender: 'பாலினத்தைத் தேர்ந்தெடுக்கவும்',
    genderMale: 'ஆண்',
    genderFemale: 'பெண்',
    labelState: 'மாநிலம்',
    labelSchool: 'பள்ளி',
    placeholderSchool: 'உங்கள் பள்ளியின் பெயரை உள்ளிடவும்',
    labelTeacher: 'ஆசிரியர்',
    labelClass: 'வகுப்பு',
    labelAspiration: 'ஆசை / வாழ்க்கை இலக்கு',
    placeholderAspiration: 'உங்கள் வாழ்க்கை இலக்கு',
    labelPreferredLang: 'தேர்ந்தெடுக்கப்பட்ட மொழி',
    labelProfilePicture: 'படம்',
    labelChangePassword: 'கடவுச்சொல் மாற்ற',
    placeholderNewPassword: 'புதிய கடவுச்சொல்',
    btnClose: 'மூடு',
    btnSave: 'சேமி',
    btnSaving: 'சேமிக்கிறது…',
    langUpdated: 'மொழி புதுப்பிக்கப்பட்டது',
  },
  hi: {
    profileTitle: 'मेरी प्रोफ़ाइल',
    profileDesc: 'अपनी प्रोफ़ाइल जानकारी अपडेट करें',
    profileUpdated: 'प्रोफ़ाइल अपडेट हो गई! ✨',
    profileUpdatedDesc: 'आपकी प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई।',
    updateFailed: 'अपडेट विफल',
    updateFailedDesc: 'प्रोफ़ाइल अपडेट करने में विफल। कृपया पुनः प्रयास करें।',
    avatarBucketError: 'अभी प्रोफ़ाइल फ़ोटो अपलोड नहीं हो सकी। कृपया व्यवस्थापक से "avatars" स्टोरेज बकेट बनाने को कहें।',
    labelFullName: 'पूरा नाम',
    labelPhoneEmail: 'फ़ोन / ईमेल',
    labelGender: 'लिंग',
    selectGender: 'लिंग चुनें',
    genderMale: 'पुरुष',
    genderFemale: 'महिला',
    labelState: 'राज्य',
    labelSchool: 'स्कूल',
    placeholderSchool: 'अपने स्कूल का नाम दर्ज करें',
    labelTeacher: 'शिक्षक',
    labelClass: 'कक्षा',
    labelAspiration: 'आकांक्षा / करियर लक्ष्य',
    placeholderAspiration: 'आपका करियर लक्ष्य',
    labelPreferredLang: 'पसंदीदा भाषा',
    labelProfilePicture: 'प्रोफ़ाइल फ़ोटो',
    labelChangePassword: 'पासवर्ड बदलें',
    placeholderNewPassword: 'नया पासवर्ड',
    btnClose: 'बंद करें',
    btnSave: 'सहेजें',
    btnSaving: 'सहेजा जा रहा है…',
    langUpdated: 'भाषा अपडेट हो गई',
  },
};

export default function ProfileDialog({ open, onOpenChange }: Props) {
  const { userProfile, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const { t, lang, setLang } = useLang();
  const isTeacher = userProfile?.role === 'teacher';

  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [goal, setGoal] = useState('');
  const [school, setSchool] = useState('');
  const [selectedLang, setSelectedLang] = useState<'en' | 'kn' | 'ta' | 'hi'>('en');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [meta, setMeta] = useState<{ mobile?: string | null; state?: string; className?: string; teacherName?: string }>();
  const hasRefreshedRef = useRef(false);

  useEffect(() => {
    if (!userProfile?.id) return;
    logger.log('🔄 ProfileDialog: Loading user profile data:', userProfile);
    setFullName(userProfile.full_name || '');
    setGender((userProfile as any).gender || '');
    setGoal((userProfile as any).career_goals || '');
    setSchool((userProfile as any).school || '');
    setSelectedLang((userProfile.preferred_language as 'en' | 'kn' | 'ta' | 'hi') || 'en');
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
          mobile: (userProfile as any).mobile || null,
          state:
            (Array.isArray((studentRes.data as any)?.classes?.states)
              ? (studentRes.data as any)?.classes?.states[0]?.state_name
              : (studentRes.data as any)?.classes?.states?.state_name) ||
            (Array.isArray((teacherRes.data as any)?.states)
              ? (teacherRes.data as any)?.states[0]?.state_name
              : (teacherRes.data as any)?.states?.state_name) ||
            (userStateRes.data as any)?.states?.state_name ||
            '',
          className: (studentRes.data as any)?.classes?.name || (teacherRes.data as any)?.classes?.name || '',
          teacherName: (studentRes.data as any)?.teachers?.users?.full_name || '',
        });
      } catch (e) {
        // swallow optional meta fetch errors
      }
    })();
  }, [userProfile?.id]);

  const contactLabel = useMemo(() => meta?.mobile || '', [meta]);

  // Refresh profile data when dialog opens — guard prevents re-firing on every render
  useEffect(() => {
    if (open && userProfile?.id && !hasRefreshedRef.current) {
      hasRefreshedRef.current = true;
      logger.log('🔄 ProfileDialog opened - refreshing profile data');
      refreshUserProfile();
    }
    if (!open) {
      hasRefreshedRef.current = false;
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

          logger.log('📤 Uploading profile picture:', {
            path,
            userId,
            userProfileId: userProfile.id,
            fileSize: avatarFile.size,
            fileName: avatarFile.name,
            fileType: avatarFile.type
          });

          const { error: upErr } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true });
          if (upErr) {
            logger.error('❌ Avatar upload error:', upErr);
            if (upErr.message?.includes('Bucket not found') || upErr.message?.includes('does not exist')) {
              throw new Error('Storage bucket "avatars" not found. Please run the database migration (20251112000002_ensure_avatars_bucket_exists.sql) or contact your administrator to set up file storage.');
            }
            if (upErr.message?.includes('row-level security policy') || upErr.message?.includes('RLS') || upErr.message?.includes('new row violates')) {
              logger.error('🔒 RLS Policy Error Details:', {
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

          logger.log('✅ Avatar uploaded successfully');
          const { data } = supabase.storage.from('avatars').getPublicUrl(path);
          avatarUrl = data.publicUrl;
        } catch (uploadError) {
          logger.error('❌ Avatar upload failed:', uploadError);
          throw new Error(`Failed to upload profile picture: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
      }
      // update users row via RPC (works for both Supabase-auth and custom-auth students)
      const updateData = {
        p_user_id: userProfile.id,
        p_full_name: fullName,
        p_gender: gender || null,
        p_school: school || null,
        p_profile_picture_url: avatarUrl,
        p_career_goals: isTeacher ? (userProfile as any).career_goals || null : goal || null,
        p_preferred_language: selectedLang,
      };

      logger.log('🔄 Updating user profile with data:', updateData);

      const { data: updateResult, error } = await supabase.rpc('update_user_profile', updateData as any);

      if (error) {
        logger.error('❌ Database update error:', error);
        throw error;
      }

      logger.log('✅ Database update successful:', updateResult);
      // password change — all roles use Supabase Auth
      if (password) {
        const { error: pwErr } = await supabase.auth.updateUser({ password });
        if (pwErr) {
          toast({ title: t('error'), description: pwErr.message, variant: 'destructive' });
        } else {
          toast({ title: t('success'), description: t('passwordUpdated') });
        }
      }

      toast({ title: PD[selectedLang].profileUpdated, description: PD[selectedLang].profileUpdatedDesc });

      // Refresh user profile so userProfile.preferred_language is up-to-date
      // (must happen before setLang so derivedLang in LangProvider doesn't revert it)
      await refreshUserProfile();

      // Sync language context immediately if changed
      if (selectedLang !== lang) {
        setLang(selectedLang);
        toast({ title: PD[selectedLang].langUpdated });
      }

      onOpenChange(false);
    } catch (err: any) {
      logger.error('Profile save error:', err);
      const rawMessage = (err && err.message ? String(err.message) : '').toLowerCase();
      const description = rawMessage.includes('avatars') && rawMessage.includes('bucket')
        ? PD[selectedLang].avatarBucketError
        : PD[selectedLang].updateFailedDesc;
      toast({ title: PD[selectedLang].updateFailed, description, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto w-[95vw] md:w-full" lang={selectedLang} dir="auto">
        <DialogHeader>
          <DialogTitle>{PD[selectedLang].profileTitle}</DialogTitle>
          <DialogDescription>{PD[selectedLang].profileDesc}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{PD[selectedLang].labelFullName}</Label>
            <Input lang={selectedLang} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label>{PD[selectedLang].labelPhoneEmail}</Label>
            <Input value={contactLabel} disabled />
          </div>
          <div>
            <Label>{PD[selectedLang].labelGender}</Label>
            <Select value={gender} onValueChange={(v: any) => setGender(v)}>
              <SelectTrigger><SelectValue placeholder={PD[selectedLang].selectGender} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{PD[selectedLang].genderMale}</SelectItem>
                <SelectItem value="female">{PD[selectedLang].genderFemale}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>{PD[selectedLang].labelState}</Label>
              <Input value={meta?.state || ''} disabled />
            </div>
            <div>
              <Label>{PD[selectedLang].labelSchool}</Label>
              <Input lang={selectedLang} value={school} onChange={(e) => setSchool(e.target.value)} placeholder={PD[selectedLang].placeholderSchool} />
            </div>
          </div>
          {!isTeacher && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>{PD[selectedLang].labelTeacher}</Label>
                <Input value={meta?.teacherName || ''} disabled />
              </div>
              <div>
                <Label>{PD[selectedLang].labelClass}</Label>
                <Input value={meta?.className || ''} disabled />
              </div>
            </div>
          )}
          {!isTeacher && (
            <div>
              <Label>{PD[selectedLang].labelAspiration}</Label>
              <Input lang={selectedLang} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder={PD[selectedLang].placeholderAspiration} />
            </div>
          )}
          <div>
            <Label>{PD[selectedLang].labelPreferredLang}</Label>
            <Select value={selectedLang} onValueChange={(v: 'en' | 'kn' | 'ta' | 'hi') => setSelectedLang(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="kn">ಕನ್ನಡ (Kannada)</SelectItem>
                <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{PD[selectedLang].labelProfilePicture}</Label>
            <Input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
          </div>
          <div>
            <Label>{PD[selectedLang].labelChangePassword}</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={PD[selectedLang].placeholderNewPassword} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {PD[selectedLang].btnClose}
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={saveProfile} disabled={saving}>
              {saving ? PD[selectedLang].btnSaving : PD[selectedLang].btnSave}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


