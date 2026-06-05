import { logger } from '@/lib/logger';
import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AssessmentService } from '@/services/assessmentService';
import { aiSummaryService } from '@/services/aiSummaryService';
import { ResourceManager } from '@/components/ResourceManager';
import ImportStudentsDialog from '@/components/ImportStudentsDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Users, School, BookOpen, LogOut, Trash2, Edit, Plus, UserCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ProfileDialog from '@/components/ProfileDialog';

// ── Interfaces ────────────────────────────────────────────────────────────────

interface Organization { id: string; name: string; created_at: string }

interface StateRow {
  id: string; name: string; state_code: string | null;
  org_id: string; orgs: { name: string }; created_at: string
}

interface Teacher {
  id: string; state_id: string; is_active: boolean;
  users: { full_name: string; mobile: string };
  states: { name: string };
  classes?: { name: string }
}

interface Student {
  id: string; enrollment_status: string;
  users: { full_name: string; mobile: string };
  classes: { name: string; states: { name: string } };
  teachers: { users: { full_name: string }; is_default?: boolean }
}

interface ClassRow { id: string; name: string; state_id: string; states: { name: string } }

interface AdminUser {
  id: string; full_name: string; email: string;
  role: 'admin' | 'teacher' | 'student';
  preferred_language: string; mobile: string | null;
  bio: string | null; interests: string | null;
  career_goals: string | null; strengths: string | null;
  areas_for_growth: string | null; profile_picture_url: string | null;
  date_of_birth: string | null; gender: string | null;
  address: string | null; school: string | null;
}

interface AuditLog {
  id: string; actor_user_id: string | null; action: string;
  target_type: string; target_id: string | null;
  target_name: string | null; created_at: string;
}

interface TemplateRow {
  id: string; assessment_type: string; title: string;
  description: string | null; instructions: string | null; is_active: boolean
}

interface SummaryTemplateRow {
  id: string; assessment_type: string; title: string; is_active: boolean
}

interface MediaSourceRow {
  id: string; title: string; url: string;
  description: string | null; sequence_number: number
}

interface InspirationSource {
  id: string; title: string; url: string;
  description: string | null; sequence_number: number; lang: string
}

interface ContentTranslationRow {
  id: string; resource_type: string; resource_key: string; lang: string; text: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ASSESSMENT_TYPES = [
  'inspiration', 'about_me', 'dreams', 'school_learning',
  'hobbies', 'role_models', 'personality', 'career_guidance_tools',
];

const QUERY_LIMIT = 500;

function isValidUrl(url: string): boolean {
  try { const u = new URL(url); return u.protocol === 'http:' || u.protocol === 'https:'; }
  catch { return false; }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { userProfile, signOut } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  const urlLang = useMemo(
    () => new URLSearchParams(location.search).get('lang') as 'en' | 'kn' | 'ta' | 'hi' | null,
    [location.search]
  );
  const lang = (urlLang || userProfile?.preferred_language ||
    (localStorage.getItem('lang') as 'en' | 'kn' | 'ta' | 'hi' | null) || 'en') as 'en' | 'kn' | 'ta' | 'hi';
  useEffect(() => { try { localStorage.setItem('lang', lang); } catch { } }, [lang]);

  // ── i18n ───────────────────────────────────────────────────────────────────
  const strings: Record<'en' | 'kn' | 'ta' | 'hi', Record<string, string | Function>> = {
    en: {
      adminDashboard: 'Admin Dashboard', adminPanel: 'CareerCompass Administration Panel',
      signOut: 'Sign Out', organizations: 'Organizations', schools: 'Schools',
      teachers: 'Teachers', students: 'Students', underIlp: 'Under ILP Mentor',
      tabs_orgs: 'Organizations', tabs_states: 'Schools', tabs_teachers: 'Teachers',
      tabs_students: 'Students', tabs_reports: 'Reports', tabs_users: 'Users', tabs_content: 'Content',
      createOrg: 'Create New Organization', createOrgDesc: 'Add a new organization to the system',
      orgNamePh: 'Organization name', createBtn: 'Create', orgsTitle: 'Organizations',
      createSchool: 'Create New School', createSchoolDesc: 'Add a new school to an organization',
      schoolNamePh: 'School name', stateCodePh: 'State code (optional)', selectOrg: 'Select organization',
      renameOrgTitle: 'Rename Organization', renameStateTitle: 'Edit School',
      stateCodeLabel: 'State Code',
      reports: 'System Reports', reportsDesc: 'Generate reports and analytics',
      noData: 'No data', filters: 'Filters',
      mentorOnly: 'Students under ILP Mentor (Unassigned)',
      // teachers tab
      teacherDesc: 'Manage teacher accounts and assignments',
      deactivate: 'Deactivate', activate: 'Activate',
      // students tab
      studentDesc: 'Manage student accounts and assignments',
      importStudents: 'Import Students', selectTeacherImport: 'Select teacher to import for',
      selectTeacherPh: 'Select teacher',
      // classes
      classesTitle: 'Classes Management', classesDesc: 'Create and manage classes within schools',
      addClass: 'Add Class', classNamePh: 'Class name', selectState: 'Select school',
      deleteClassConfirm: 'Delete this class? Students in it will lose their class assignment.',
      // user management
      usersTitle: 'User Management', usersDesc: 'View and edit user accounts',
      editUser: 'Edit User', saveChanges: 'Save Changes', cancel: 'Cancel',
      name: 'Name', email: 'Email', role: 'Role', language: 'Language', mobile: 'Mobile',
      promoteAdmin: 'Promote to Admin',
      promoteAdminConfirm: 'Promote this user to Admin? They will gain full admin access.',
      // content management
      contentTitle: 'Content Management',
      assessmentTemplates: 'Assessment Templates',
      assessmentTemplatesDesc: 'Edit assessment titles, descriptions and instructions',
      summaryTemplates: 'Summary Templates',
      summaryTemplatesDesc: 'Manage AI summary template status and prompt questions',
      mediaSources: 'Media Sources', mediaSourcesDesc: 'Manage video and media links per assessment',
      editTemplate: 'Edit Template', title: 'Title', description: 'Description',
      instructions: 'Instructions', active: 'Active',
      addMedia: 'Add Media Source', mediaTitle: 'Media title', mediaUrl: 'Media URL',
      mediaDesc: 'Description (optional)', mediaSeq: 'Order',
      selectAssessment: 'Select assessment', loadMedia: 'Load',
      deleteConfirm: 'Delete this item?',
      // summary JSONB editor
      editSummaryTitle: 'Edit Summary Questions',
      summaryQuestionsJson: 'Summary questions JSON',
      jsonParseError: 'Invalid JSON — please fix before saving',
      // inspiration videos
      inspVideosTitle: 'Inspiration Videos', inspVideosDesc: 'Manage per-language inspiration video links',
      addVideo: 'Add Video', videoTitlePh: 'Video title', videoUrlPh: 'YouTube / video URL',
      langFilterLabel: 'Language', langAll: 'All languages',
      // content translations
      ctTitle: 'Content Translations', ctDesc: 'View and edit localized UI strings',
      ctResourceType: 'Resource type (required to load)', ctLoad: 'Load',
      ctKey: 'Key', ctLang: 'Lang', ctValue: 'Value', ctSaveRow: 'Save',
      // resources
      resourcesTitle: 'Counselling Resources',
      // validation
      invalidUrl: 'Please enter a valid http/https URL',
      // status / labels
      unassigned: 'Unassigned', inactive: 'Inactive',
      // cascade delete hints
      orgDeleteHint: (n: number) => `This will also delete ${n} school(s) and all their data.`,
      stateDeleteHint: (teachers: number, students: number) =>
        `This school has ${teachers} teacher(s) and ${students} student(s). Delete anyway?`,
      confirmBtn: 'Confirm', promoteBtn: 'Promote', myProfile: 'My Profile',
      searchTeachers: 'Search teachers...', searchStudents: 'Search students...',
      // user profile columns
      bio: 'Bio', interests: 'Interests', careerGoals: 'Career Goals',
      strengths: 'Strengths', areasForGrowth: 'Areas for Growth',
      profilePicture: 'Profile Picture', dob: 'Date of Birth',
      genderLabel: 'Gender', addressLabel: 'Address', schoolLabel: 'School',
      // audit log
      auditLog: 'Audit Log', auditLogDesc: 'Last 50 administrative actions (most recent first)',
      auditAction: 'Action', auditTarget: 'Target', auditWhen: 'When', auditActor: 'Actor',
      loadAudit: 'Load Audit Log',
      // profile picture orphan check
      profilePicCheck: 'Profile Picture Check',
      profilePicCheckDesc: 'Users by profile picture URL status',
      withPic: 'URL set', withoutPic: 'No URL',
    },
    kn: {
      adminDashboard: 'ಆಡಳಿತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', adminPanel: 'CareerCompass ಆಡಳಿತ ಫಲಕ',
      signOut: 'ಲಾಗ್ ಔಟ್', organizations: 'ಸಂಸ್ಥೆಗಳು', schools: 'ಶಾಲೆಗಳು',
      teachers: 'ಶಿಕ್ಷಕರು', students: 'ವಿದ್ಯಾರ್ಥಿಗಳು', underIlp: 'ILP ಮಾರ್ಗದರ್ಶಕ ಅಡಿಯಲ್ಲಿ',
      tabs_orgs: 'ಸಂಸ್ಥೆಗಳು', tabs_states: 'ಶಾಲೆಗಳು', tabs_teachers: 'ಶಿಕ್ಷಕರು',
      tabs_students: 'ವಿದ್ಯಾರ್ಥಿಗಳು', tabs_reports: 'ವರದಿಗಳು', tabs_users: 'ಬಳಕೆದಾರರು', tabs_content: 'ವಿಷಯ',
      createOrg: 'ಹೊಸ ಸಂಸ್ಥೆಯನ್ನು ರಚಿಸಿ', createOrgDesc: 'ವ್ಯವಸ್ಥೆಗೆ ಹೊಸ ಸಂಸ್ಥೆಯನ್ನು ಸೇರಿಸಿ',
      orgNamePh: 'ಸಂಸ್ಥೆಯ ಹೆಸರು', createBtn: 'ರಚಿಸಿ', orgsTitle: 'ಸಂಸ್ಥೆಗಳು',
      createSchool: 'ಹೊಸ ಶಾಲೆಯನ್ನು ರಚಿಸಿ', createSchoolDesc: 'ಸಂಸ್ಥೆಗೆ ಹೊಸ ಶಾಲೆಯನ್ನು ಸೇರಿಸಿ',
      schoolNamePh: 'ಶಾಲೆಯ ಹೆಸರು', stateCodePh: 'ರಾಜ್ಯ ಕೋಡ್ (ಐಚ್ಛಿಕ)',
      selectOrg: 'ಸಂಸ್ಥೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
      renameOrgTitle: 'ಸಂಸ್ಥೆ ಮರುಹೆಸರಿಸಿ', renameStateTitle: 'ಶಾಲೆ ಸಂಪಾದಿಸಿ',
      stateCodeLabel: 'ರಾಜ್ಯ ಕೋಡ್',
      reports: 'ಸಿಸ್ಟಂ ವರದಿಗಳು', reportsDesc: 'ವರದಿ ಮತ್ತು ವಿಶ್ಲೇಷಣೆಗಳನ್ನು ರಚಿಸಿ',
      noData: 'ಡೇಟಾ ಇಲ್ಲ', filters: 'ಫಿಲ್ಟರ್ ಗಳು',
      mentorOnly: 'ILP ಮಾರ್ಗದರ್ಶಕ (ಅನಿಯೋಜಿತ) ಅಡಿಯಲ್ಲಿ ವಿದ್ಯಾರ್ಥಿಗಳು',
      teacherDesc: 'ಶಿಕ್ಷಕ ಖಾತೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ',
      deactivate: 'ನಿಷ್ಕ್ರಿಯಗೊಳಿಸಿ', activate: 'ಸಕ್ರಿಯಗೊಳಿಸಿ',
      studentDesc: 'ವಿದ್ಯಾರ್ಥಿ ಖಾತೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ',
      importStudents: 'ವಿದ್ಯಾರ್ಥಿಗಳನ್ನು ಆಮದು ಮಾಡಿ', selectTeacherImport: 'ಆಮದು ಮಾಡಲು ಶಿಕ್ಷಕರನ್ನು ಆಯ್ಕೆಮಾಡಿ',
      selectTeacherPh: 'ಶಿಕ್ಷಕರನ್ನು ಆಯ್ಕೆಮಾಡಿ',
      classesTitle: 'ತರಗತಿ ನಿರ್ವಹಣೆ', classesDesc: 'ಶಾಲೆಗಳಲ್ಲಿ ತರಗತಿಗಳನ್ನು ರಚಿಸಿ ಮತ್ತು ನಿರ್ವಹಿಸಿ',
      addClass: 'ತರಗತಿ ಸೇರಿಸಿ', classNamePh: 'ತರಗತಿ ಹೆಸರು', selectState: 'ಶಾಲೆ ಆಯ್ಕೆಮಾಡಿ',
      deleteClassConfirm: 'ಈ ತರಗತಿಯನ್ನು ಅಳಿಸಬೇಕೇ?',
      usersTitle: 'ಬಳಕೆದಾರ ನಿರ್ವಹಣೆ', usersDesc: 'ಬಳಕೆದಾರ ಖಾತೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ ಮತ್ತು ಸಂಪಾದಿಸಿ',
      editUser: 'ಬಳಕೆದಾರರನ್ನು ಸಂಪಾದಿಸಿ', saveChanges: 'ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ', cancel: 'ರದ್ದು',
      name: 'ಹೆಸರು', email: 'ಇಮೇಲ್', role: 'ಪಾತ್ರ', language: 'ಭಾಷೆ', mobile: 'ಮೊಬೈಲ್',
      promoteAdmin: 'ಆಡಳಿತಕ್ಕೆ ಉನ್ನತೀಕರಿಸಿ',
      promoteAdminConfirm: 'ಈ ಬಳಕೆದಾರರನ್ನು ಆಡಳಿತಕ್ಕೆ ಉನ್ನತೀಕರಿಸಬೇಕೇ?',
      contentTitle: 'ವಿಷಯ ನಿರ್ವಹಣೆ',
      assessmentTemplates: 'ಮೌಲ್ಯಮಾಪನ ಟೆಂಪ್ಲೇಟ್‌ಗಳು',
      assessmentTemplatesDesc: 'ಮೌಲ್ಯಮಾಪನ ಶೀರ್ಷಿಕೆ ಮತ್ತು ಸೂಚನೆಗಳನ್ನು ಸಂಪಾದಿಸಿ',
      summaryTemplates: 'ಸಾರಾಂಶ ಟೆಂಪ್ಲೇಟ್‌ಗಳು',
      summaryTemplatesDesc: 'AI ಸಾರಾಂಶ ಟೆಂಪ್ಲೇಟ್ ಮತ್ತು ಪ್ರಶ್ನೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ',
      mediaSources: 'ಮಾಧ್ಯಮ ಮೂಲಗಳು', mediaSourcesDesc: 'ಮೌಲ್ಯಮಾಪನದ ವೀಡಿಯೊ ಲಿಂಕ್‌ಗಳನ್ನು ನಿರ್ವಹಿಸಿ',
      editTemplate: 'ಟೆಂಪ್ಲೇಟ್ ಸಂಪಾದಿಸಿ', title: 'ಶೀರ್ಷಿಕೆ', description: 'ವಿವರಣೆ',
      instructions: 'ಸೂಚನೆಗಳು', active: 'ಸಕ್ರಿಯ',
      addMedia: 'ಮಾಧ್ಯಮ ಸೇರಿಸಿ', mediaTitle: 'ಮಾಧ್ಯಮ ಶೀರ್ಷಿಕೆ', mediaUrl: 'ಮಾಧ್ಯಮ URL',
      mediaDesc: 'ವಿವರಣೆ (ಐಚ್ಛಿಕ)', mediaSeq: 'ಕ್ರಮ',
      selectAssessment: 'ಮೌಲ್ಯಮಾಪನ ಆಯ್ಕೆಮಾಡಿ', loadMedia: 'ಲೋಡ್',
      deleteConfirm: 'ಈ ಐಟಂ ಅಳಿಸಬೇಕೇ?',
      editSummaryTitle: 'ಸಾರಾಂಶ ಪ್ರಶ್ನೆಗಳನ್ನು ಸಂಪಾದಿಸಿ',
      summaryQuestionsJson: 'ಸಾರಾಂಶ ಪ್ರಶ್ನೆಗಳ JSON',
      jsonParseError: 'ಅಮಾನ್ಯ JSON — ಉಳಿಸುವ ಮೊದಲು ಸರಿಪಡಿಸಿ',
      inspVideosTitle: 'ಪ್ರೇರಣಾ ವೀಡಿಯೊಗಳು', inspVideosDesc: 'ಪ್ರತಿ ಭಾಷೆಗೆ ಪ್ರೇರಣಾ ವೀಡಿಯೊ ಲಿಂಕ್‌ಗಳನ್ನು ನಿರ್ವಹಿಸಿ',
      addVideo: 'ವೀಡಿಯೊ ಸೇರಿಸಿ', videoTitlePh: 'ವೀಡಿಯೊ ಶೀರ್ಷಿಕೆ', videoUrlPh: 'YouTube / ವೀಡಿಯೊ URL',
      langFilterLabel: 'ಭಾಷೆ', langAll: 'ಎಲ್ಲಾ ಭಾಷೆಗಳು',
      ctTitle: 'ಸಾಮಗ್ರಿ ಅನುವಾದಗಳು', ctDesc: 'ಸ್ಥಳೀಕೃತ UI ಸ್ಟ್ರಿಂಗ್‌ಗಳನ್ನು ವೀಕ್ಷಿಸಿ ಮತ್ತು ಸಂಪಾದಿಸಿ',
      ctResourceType: 'ಸಂಪನ್ಮೂಲ ಪ್ರಕಾರ (ಲೋಡ್ ಮಾಡಲು ಅಗತ್ಯ)', ctLoad: 'ಲೋಡ್',
      ctKey: 'ಕೀ', ctLang: 'ಭಾಷೆ', ctValue: 'ಮೌಲ್ಯ', ctSaveRow: 'ಉಳಿಸಿ',
      resourcesTitle: 'ಸಲಹಾ ಸಂಪನ್ಮೂಲಗಳು',
      invalidUrl: 'ದಯವಿಟ್ಟು ಮಾನ್ಯ http/https URL ನಮೂದಿಸಿ',
      unassigned: 'ನಿಯೋಜಿಸಲಾಗಿಲ್ಲ', inactive: 'ನಿಷ್ಕ್ರಿಯ',
      orgDeleteHint: (n: number) => `ಇದು ${n} ಶಾಲೆ(ಗಳು) ಮತ್ತು ಅವರ ಎಲ್ಲಾ ಡೇಟಾವನ್ನು ಅಳಿಸುತ್ತದೆ.`,
      stateDeleteHint: (teachers: number, students: number) =>
        `ಈ ಶಾಲೆಯಲ್ಲಿ ${teachers} ಶಿಕ್ಷಕ(ರು) ಮತ್ತು ${students} ವಿದ್ಯಾರ್ಥಿ(ಗಳು) ಇದ್ದಾರೆ. ಅಳಿಸಬೇಕೇ?`,
      confirmBtn: 'ದೃಢೀಕರಿಸಿ', promoteBtn: 'ಉನ್ನತೀಕರಿಸಿ', myProfile: 'ನನ್ನ ಪ್ರೊಫೈಲ್',
      searchTeachers: 'ಶಿಕ್ಷಕರನ್ನು ಹುಡುಕಿ...', searchStudents: 'ವಿದ್ಯಾರ್ಥಿಗಳನ್ನು ಹುಡುಕಿ...',
    },
    ta: {
      adminDashboard: 'நிர்வாக பக்கம்', adminPanel: 'CareerCompass நிர்வாகம்',
      signOut: 'வெளியேறு', organizations: 'நிறுவனங்கள்', schools: 'பள்ளிகள்',
      teachers: 'ஆசிரியர்கள்', students: 'மாணவர்கள்', underIlp: 'ILP வழிகாட்டி பார்த்து',
      tabs_orgs: 'நிறுவனங்கள்', tabs_states: 'பள்ளிகள்', tabs_teachers: 'ஆசிரியர்கள்',
      tabs_students: 'மாணவர்கள்', tabs_reports: 'அறிக்கைகள்', tabs_users: 'பயனர்கள்', tabs_content: 'உள்ளடக்கம்',
      createOrg: 'புதிய நிறுவனம் சேர்', createOrgDesc: 'புதிய நிறுவனத்தை சேர்க்கவும்',
      orgNamePh: 'நிறுவனத்தின் பெயர்', createBtn: 'சேர்', orgsTitle: 'நிறுவனங்கள்',
      createSchool: 'புதிய பள்ளி சேர்', createSchoolDesc: 'புதிய பள்ளியை சேர்க்கவும்',
      schoolNamePh: 'பள்ளியின் பெயர்', stateCodePh: 'மாநில குறியீடு (விருப்பம்)',
      selectOrg: 'நிறுவனத்தை தேர்ந்தெடு',
      renameOrgTitle: 'நிறுவனம் மறுபெயரிடு', renameStateTitle: 'பள்ளி திருத்து',
      stateCodeLabel: 'மாநில குறியீடு',
      reports: 'அறிக்கைகள்', reportsDesc: 'அறிக்கைகளை பார்',
      noData: 'தகவல் இல்லை', filters: 'வடிகட்டி',
      mentorOnly: 'ILP வழிகாட்டி பார்த்து (ஆசிரியர் இல்லாத) மாணவர்கள்',
      teacherDesc: 'ஆசிரியர் கணக்குகளை நிர்வகிக்கவும்',
      deactivate: 'செயலிழக்க', activate: 'செயல்படுத்து',
      studentDesc: 'மாணவர் கணக்குகளை நிர்வகிக்கவும்',
      importStudents: 'மாணவர்களை இறக்குமதி', selectTeacherImport: 'இறக்குமதிக்கு ஆசிரியர் தேர்ந்தெடு',
      selectTeacherPh: 'ஆசிரியர் தேர்ந்தெடு',
      classesTitle: 'வகுப்பு மேலாண்மை', classesDesc: 'பள்ளிகளில் வகுப்புகளை நிர்வகிக்கவும்',
      addClass: 'வகுப்பு சேர்', classNamePh: 'வகுப்பு பெயர்', selectState: 'பள்ளி தேர்ந்தெடு',
      deleteClassConfirm: 'இந்த வகுப்பை நீக்கவா?',
      usersTitle: 'பயனர் மேலாண்மை', usersDesc: 'பயனர் கணக்குகளை பார்க்கவும் மற்றும் திருத்தவும்',
      editUser: 'பயனரை திருத்து', saveChanges: 'மாற்றங்களை சேமி', cancel: 'ரத்து செய்',
      name: 'பெயர்', email: 'மின்னஞ்சல்', role: 'பதவி', language: 'மொழி', mobile: 'மொபைல்',
      promoteAdmin: 'நிர்வாகியாக உயர்த்து', promoteAdminConfirm: 'இந்த பயனரை நிர்வாகியாக உயர்த்தவா?',
      contentTitle: 'உள்ளடக்க மேலாண்மை',
      assessmentTemplates: 'மதிப்பீட்டு வார்ப்புருக்கள்',
      assessmentTemplatesDesc: 'மதிப்பீட்டு தலைப்புகள் மற்றும் வழிமுறைகளை திருத்தவும்',
      summaryTemplates: 'சுருக்க வார்ப்புருக்கள்',
      summaryTemplatesDesc: 'AI சுருக்க வார்ப்புரு மற்றும் கேள்விகளை நிர்வகிக்கவும்',
      mediaSources: 'ஊடக ஆதாரங்கள்', mediaSourcesDesc: 'மதிப்பீட்டுக்கான வீடியோ இணைப்புகளை நிர்வகிக்கவும்',
      editTemplate: 'வார்ப்புரு திருத்து', title: 'தலைப்பு', description: 'விளக்கம்',
      instructions: 'வழிமுறைகள்', active: 'செயலில்',
      addMedia: 'ஊடகம் சேர்', mediaTitle: 'ஊடக தலைப்பு', mediaUrl: 'ஊடக URL',
      mediaDesc: 'விளக்கம் (விருப்பம்)', mediaSeq: 'வரிசை',
      selectAssessment: 'மதிப்பீட்டை தேர்ந்தெடு', loadMedia: 'ஏற்று',
      deleteConfirm: 'இந்த உருப்படியை நீக்கவா?',
      editSummaryTitle: 'சுருக்க கேள்விகளை திருத்து',
      summaryQuestionsJson: 'சுருக்க கேள்விகள் JSON',
      jsonParseError: 'தவறான JSON — சேமிக்கும் முன் சரிசெய்யவும்',
      inspVideosTitle: 'உத்வேகம் வீடியோக்கள்', inspVideosDesc: 'மொழிவாரி உத்வேக வீடியோ இணைப்புகளை நிர்வகிக்கவும்',
      addVideo: 'வீடியோ சேர்', videoTitlePh: 'வீடியோ தலைப்பு', videoUrlPh: 'YouTube / வீடியோ URL',
      langFilterLabel: 'மொழி', langAll: 'அனைத்து மொழிகள்',
      ctTitle: 'உள்ளடக்க மொழிபெயர்ப்புகள்', ctDesc: 'UI சரங்களை பார்க்கவும் மற்றும் திருத்தவும்',
      ctResourceType: 'வள வகை (ஏற்றுவதற்கு தேவை)', ctLoad: 'ஏற்று',
      ctKey: 'திறவுகோல்', ctLang: 'மொழி', ctValue: 'மதிப்பு', ctSaveRow: 'சேமி',
      resourcesTitle: 'ஆலோசனை வளங்கள்',
      invalidUrl: 'சரியான http/https URL உள்ளிடவும்',
      unassigned: 'ஒதுக்கப்படவில்லை', inactive: 'செயலில் இல்லை',
      orgDeleteHint: (n: number) => `இது ${n} பள்ளி(கள்) மற்றும் அவற்றின் அனைத்து தரவையும் நீக்கும்.`,
      stateDeleteHint: (teachers: number, students: number) =>
        `இந்த பள்ளியில் ${teachers} ஆசிரியர்(கள்) மற்றும் ${students} மாணவர்(கள்) உள்ளனர். நீக்கவா?`,
      confirmBtn: 'உறுதிப்படுத்து', promoteBtn: 'உயர்த்து', myProfile: 'என் சுயவிவரம்',
      searchTeachers: 'ஆசிரியர்களை தேடு...', searchStudents: 'மாணவர்களை தேடு...',
    },
    hi: {
      adminDashboard: 'व्यवस्थापक डैशबोर्ड', adminPanel: 'CareerCompass प्रशासन पैनल',
      signOut: 'साइन आउट', organizations: 'संगठन', schools: 'विद्यालय',
      teachers: 'शिक्षक', students: 'छात्र', underIlp: 'ILP मेंटर के अंतर्गत',
      tabs_orgs: 'संगठन', tabs_states: 'विद्यालय', tabs_teachers: 'शिक्षक',
      tabs_students: 'छात्र', tabs_reports: 'रिपोर्ट', tabs_users: 'उपयोगकर्ता', tabs_content: 'सामग्री',
      createOrg: 'नया संगठन बनाएं', createOrgDesc: 'सिस्टम में नया संगठन जोड़ें',
      orgNamePh: 'संगठन का नाम', createBtn: 'बनाएं', orgsTitle: 'संगठन',
      createSchool: 'नया विद्यालय बनाएं', createSchoolDesc: 'संगठन में नया विद्यालय जोड़ें',
      schoolNamePh: 'विद्यालय का नाम', stateCodePh: 'राज्य कोड (वैकल्पिक)',
      selectOrg: 'संगठन चुनें',
      renameOrgTitle: 'संगठन का नाम बदलें', renameStateTitle: 'विद्यालय संपादित करें',
      stateCodeLabel: 'राज्य कोड',
      reports: 'सिस्टम रिपोर्ट', reportsDesc: 'रिपोर्ट और विश्लेषण बनाएं',
      noData: 'कोई डेटा नहीं', filters: 'फ़िल्टर',
      mentorOnly: 'ILP मेंटर के अंतर्गत छात्र (अनिर्धारित)',
      teacherDesc: 'शिक्षक खातों का प्रबंधन करें',
      deactivate: 'निष्क्रिय करें', activate: 'सक्रिय करें',
      studentDesc: 'छात्र खातों का प्रबंधन करें',
      importStudents: 'छात्र आयात करें', selectTeacherImport: 'आयात के लिए शिक्षक चुनें',
      selectTeacherPh: 'शिक्षक चुनें',
      classesTitle: 'कक्षा प्रबंधन', classesDesc: 'विद्यालयों में कक्षाएं बनाएं और प्रबंधित करें',
      addClass: 'कक्षा जोड़ें', classNamePh: 'कक्षा का नाम', selectState: 'विद्यालय चुनें',
      deleteClassConfirm: 'इस कक्षा को हटाएं?',
      usersTitle: 'उपयोगकर्ता प्रबंधन', usersDesc: 'उपयोगकर्ता खातों को देखें और संपादित करें',
      editUser: 'उपयोगकर्ता संपादित करें', saveChanges: 'परिवर्तन सहेजें', cancel: 'रद्द करें',
      name: 'नाम', email: 'ईमेल', role: 'भूमिका', language: 'भाषा', mobile: 'मोबाइल',
      promoteAdmin: 'व्यवस्थापक बनाएं',
      promoteAdminConfirm: 'इस उपयोगकर्ता को व्यवस्थापक बनाएं? उन्हें पूर्ण एक्सेस मिलेगी।',
      contentTitle: 'सामग्री प्रबंधन',
      assessmentTemplates: 'मूल्यांकन टेम्पलेट',
      assessmentTemplatesDesc: 'मूल्यांकन शीर्षक, विवरण और निर्देश संपादित करें',
      summaryTemplates: 'सारांश टेम्पलेट',
      summaryTemplatesDesc: 'AI सारांश टेम्पलेट और प्रश्न प्रबंधित करें',
      mediaSources: 'मीडिया स्रोत', mediaSourcesDesc: 'मूल्यांकन के लिए वीडियो लिंक प्रबंधित करें',
      editTemplate: 'टेम्पलेट संपादित करें', title: 'शीर्षक', description: 'विवरण',
      instructions: 'निर्देश', active: 'सक्रिय',
      addMedia: 'मीडिया जोड़ें', mediaTitle: 'मीडिया शीर्षक', mediaUrl: 'मीडिया URL',
      mediaDesc: 'विवरण (वैकल्पिक)', mediaSeq: 'क्रम',
      selectAssessment: 'मूल्यांकन चुनें', loadMedia: 'लोड करें',
      deleteConfirm: 'इस आइटम को हटाएं?',
      editSummaryTitle: 'सारांश प्रश्न संपादित करें',
      summaryQuestionsJson: 'सारांश प्रश्न JSON',
      jsonParseError: 'अमान्य JSON — सहेजने से पहले ठीक करें',
      inspVideosTitle: 'प्रेरणा वीडियो', inspVideosDesc: 'प्रति भाषा प्रेरणा वीडियो लिंक प्रबंधित करें',
      addVideo: 'वीडियो जोड़ें', videoTitlePh: 'वीडियो शीर्षक', videoUrlPh: 'YouTube / वीडियो URL',
      langFilterLabel: 'भाषा', langAll: 'सभी भाषाएं',
      ctTitle: 'सामग्री अनुवाद', ctDesc: 'स्थानीयकृत UI स्ट्रिंग्स देखें और संपादित करें',
      ctResourceType: 'संसाधन प्रकार (लोड करने के लिए आवश्यक)', ctLoad: 'लोड करें',
      ctKey: 'कुंजी', ctLang: 'भाषा', ctValue: 'मान', ctSaveRow: 'सहेजें',
      resourcesTitle: 'परामर्श संसाधन',
      invalidUrl: 'कृपया एक मान्य http/https URL दर्ज करें',
      unassigned: 'अनिर्धारित', inactive: 'निष्क्रिय',
      orgDeleteHint: (n: number) => `इससे ${n} विद्यालय और उनका सारा डेटा हट जाएगा।`,
      stateDeleteHint: (teachers: number, students: number) =>
        `इस विद्यालय में ${teachers} शिक्षक और ${students} छात्र हैं। फिर भी हटाएं?`,
      confirmBtn: 'पुष्टि करें', promoteBtn: 'उन्नत करें', myProfile: 'मेरी प्रोफ़ाइल',
      searchTeachers: 'शिक्षक खोजें...', searchStudents: 'छात्र खोजें...',
    },
  };
  const t = (k: string, ...args: unknown[]) => {
    const v = strings[lang]?.[k] ?? strings.en[k];
    if (v === undefined) { logger.warn(`[AdminDashboard] Missing i18n key: "${k}"`); return k; }
    return typeof v === 'function' ? (v as Function)(...args) : v as string;
  };

  // ── State ──────────────────────────────────────────────────────────────────
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [states, setSchools] = useState<StateRow[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [assessmentTemplates, setAssessmentTemplates] = useState<TemplateRow[]>([]);
  const [summaryTemplates, setSummaryTemplates] = useState<SummaryTemplateRow[]>([]);
  const [mediaForAssessment, setMediaForAssessment] = useState<MediaSourceRow[]>([]);
  const [inspSources, setInspSources] = useState<InspirationSource[]>([]);
  const [ctRows, setCtRows] = useState<ContentTranslationRow[]>([]);

  const [showMentorOnly, setShowMentorOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Org / School form state
  const [newOrgName, setNewOrgName] = useState('');
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolCode, setNewSchoolCode] = useState('');  // B2
  const [selectedOrgForSchool, setSelectedOrgForSchool] = useState('');

  // B1 — rename dialogs
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editOrgName, setEditOrgName] = useState('');
  const [editingState, setEditingState] = useState<StateRow | null>(null);
  const [editStateName, setEditStateName] = useState('');
  const [editStateCode, setEditStateCode] = useState('');

  // B3 — classes
  const [newClassName, setNewClassName] = useState('');
  const [selectedStateForClass, setSelectedStateForClass] = useState('');

  // A3 — teacher deactivate (no extra state needed, directly updates teachers array)

  // A4 — student import
  const [importTeacher, setImportTeacher] = useState<Teacher | null>(null);
  const [importClasses, setImportClasses] = useState<Array<{ class_id: string; class_name: string }>>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectTeacherOpen, setSelectTeacherOpen] = useState(false);
  const [selectedTeacherForImport, setSelectedTeacherForImport] = useState('');

  // User edit dialog
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editLang, setEditLang] = useState('');

  // Assessment template edit
  const [editingTemplate, setEditingTemplate] = useState<TemplateRow | null>(null);
  const [editTplTitle, setEditTplTitle] = useState('');
  const [editTplDesc, setEditTplDesc] = useState('');
  const [editTplInstr, setEditTplInstr] = useState('');
  const [editTplActive, setEditTplActive] = useState(true);

  // C5 — summary JSONB edit
  const [editingSummaryTpl, setEditingSummaryTpl] = useState<SummaryTemplateRow | null>(null);
  const [editSummaryJson, setEditSummaryJson] = useState('');

  // Media sources
  const [selectedAssessmentForMedia, setSelectedAssessmentForMedia] = useState('');
  const [mediaLoading, setMediaLoading] = useState(false);
  const [newMediaTitle, setNewMediaTitle] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaDesc, setNewMediaDesc] = useState('');
  const [newMediaSeq, setNewMediaSeq] = useState(0);

  // D2 — inspiration videos
  const [inspLang, setInspLang] = useState('all');
  const [newInspTitle, setNewInspTitle] = useState('');
  const [newInspUrl, setNewInspUrl] = useState('');
  const [newInspLang, setNewInspLang] = useState('en');
  const [newInspSeq, setNewInspSeq] = useState(1);

  // C4 — content translations
  const [ctResourceType, setCtResourceType] = useState('');
  const [ctEditValues, setCtEditValues] = useState<Record<string, string>>({});

  // L3 — URL tab persistence
  const [activeTab, setActiveTab] = useState(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    const valid = ['organizations', 'states', 'teachers', 'students', 'reports', 'users', 'content'];
    return valid.includes(tab || '') ? tab! : 'organizations';
  });

  // B5 — confirm dialog (replaces window.confirm())
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean; title: string; description: string;
    confirmLabel: string; onConfirm: () => void | Promise<void>;
  }>({ open: false, title: '', description: '', confirmLabel: 'Confirm', onConfirm: () => {} });

  // A7 — search
  const [teacherSearch, setTeacherSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  // E7 — profile dialog
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  // Audit log
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchData = async () => {
    try {
      const [orgsRes, statesRes, teachersRes, studentsRes, classesRes, usersRes, templatesRes, summaryRes] =
        await Promise.all([
          supabase.from('orgs').select('*').order('created_at', { ascending: false }).limit(QUERY_LIMIT),
          supabase.from('states').select('id, name, state_code, org_id, orgs:org_id(name), created_at').order('created_at', { ascending: false }).limit(QUERY_LIMIT),
          supabase.from('teachers').select('id, state_id, is_active, users:user_id(full_name, mobile), states:state_id(name), classes:class_id(name)').order('created_at', { ascending: false }).limit(QUERY_LIMIT),
          supabase.from('students').select('id, enrollment_status, users:user_id(full_name, mobile), classes:class_id(name, states:state_id(name)), teachers:teacher_id(users:user_id(full_name), is_default)').order('created_at', { ascending: false }).limit(QUERY_LIMIT),
          supabase.from('classes').select('id, name, state_id, states:state_id(name)').order('name').limit(QUERY_LIMIT),
          supabase.from('users').select('id, full_name, email, role, preferred_language, mobile, bio, interests, career_goals, strengths, areas_for_growth, profile_picture_url, date_of_birth, gender, address, school').order('created_at', { ascending: false }).limit(QUERY_LIMIT),
          AssessmentService.getAllAssessmentTemplates(),
          supabase.from('assessment_summary_templates').select('id, assessment_type, title, is_active').order('assessment_type'),
        ]);

      if (orgsRes.error) throw orgsRes.error;
      if (statesRes.error) throw statesRes.error;
      if (teachersRes.error) throw teachersRes.error;
      if (studentsRes.error) throw studentsRes.error;
      if (classesRes.error) throw classesRes.error;
      if (usersRes.error) throw usersRes.error;
      if (summaryRes.error) throw summaryRes.error;

      setOrganizations(orgsRes.data || []);
      setSchools(statesRes.data as unknown as StateRow[] || []);
      setTeachers(teachersRes.data as unknown as Teacher[] || []);
      setStudents(studentsRes.data as unknown as Student[] || []);
      setClasses(classesRes.data as unknown as ClassRow[] || []);
      setAdminUsers(usersRes.data as AdminUser[] || []);
      setAssessmentTemplates(templatesRes as TemplateRow[]);
      setSummaryTemplates(summaryRes.data as SummaryTemplateRow[] || []);
    } catch (error) {
      logger.error('Error fetching data:', error);
      toast({ title: 'Error', description: 'Failed to load dashboard data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ── Targeted single-table fetch helpers (LOW — scoped refetch) ───────────

  const fetchOrgs = async () => {
    const { data, error } = await supabase.from('orgs').select('*').order('created_at', { ascending: false }).limit(QUERY_LIMIT);
    if (error) logger.error('fetchOrgs:', error);
    else setOrganizations(data || []);
  };
  const fetchSchools = async () => {
    const { data, error } = await supabase.from('states').select('id, name, state_code, org_id, orgs:org_id(name), created_at').order('created_at', { ascending: false }).limit(QUERY_LIMIT);
    if (error) logger.error('fetchSchools:', error);
    else setSchools(data as unknown as StateRow[] || []);
  };
  const fetchClasses = async () => {
    const { data, error } = await supabase.from('classes').select('id, name, state_id, states:state_id(name)').order('name').limit(QUERY_LIMIT);
    if (error) logger.error('fetchClasses:', error);
    else setClasses(data as unknown as ClassRow[] || []);
  };
  const fetchTeachers = async () => {
    const { data, error } = await supabase.from('teachers').select('id, state_id, is_active, users:user_id(full_name, mobile), states:state_id(name), classes:class_id(name)').order('created_at', { ascending: false }).limit(QUERY_LIMIT);
    if (error) logger.error('fetchTeachers:', error);
    else setTeachers(data as unknown as Teacher[] || []);
  };
  const fetchStudents = async () => {
    const { data, error } = await supabase.from('students').select('id, enrollment_status, users:user_id(full_name, mobile), classes:class_id(name, states:state_id(name)), teachers:teacher_id(users:user_id(full_name), is_default)').order('created_at', { ascending: false }).limit(QUERY_LIMIT);
    if (error) logger.error('fetchStudents:', error);
    else setStudents(data as unknown as Student[] || []);
  };
  const fetchUsers = async () => {
    const { data, error } = await supabase.from('users').select('id, full_name, email, role, preferred_language, mobile, bio, interests, career_goals, strengths, areas_for_growth, profile_picture_url, date_of_birth, gender, address, school').order('created_at', { ascending: false }).limit(QUERY_LIMIT);
    if (error) logger.error('fetchUsers:', error);
    else setAdminUsers(data as AdminUser[] || []);
  };
  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    const { data } = await (supabase as any).from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(50);
    setAuditLogs((data as AuditLog[]) || []);
    setAuditLoading(false);
  };
  const logAudit = (action: string, targetType: string, targetId: string | null, targetName: string | null) => {
    (supabase as any).from('admin_audit_log').insert({
      actor_user_id: userProfile?.id ?? null,
      action, target_type: targetType, target_id: targetId, target_name: targetName,
    }).then();
  };

  useEffect(() => { fetchData(); }, []);

  // ── Shared confirm helper (B5) ────────────────────────────────────────────

  const openConfirm = (title: string, description: string, onConfirm: () => void | Promise<void>, confirmLabel = t('confirmBtn')) => {
    setConfirmDialog({ open: true, title, description, confirmLabel, onConfirm });
  };

  // ── Org handlers ───────────────────────────────────────────────────────────

  const createOrganization = async () => {
    if (!newOrgName.trim()) return;
    const { data, error } = await supabase.from('orgs').insert({ name: newOrgName.trim() }).select('id').single();
    if (error) { toast({ title: 'Error', description: 'Failed to create organization', variant: 'destructive' }); return; }
    toast({ title: 'Organization Created', description: `${newOrgName} created` });
    logAudit('create_org', 'org', data?.id ?? null, newOrgName.trim());
    setNewOrgName('');
    fetchOrgs();
  };

  // B1 — rename org
  const openEditOrg = (org: Organization) => { setEditingOrg(org); setEditOrgName(org.name); };
  const saveOrg = async () => {
    if (!editingOrg || !editOrgName.trim()) return;
    const { error } = await supabase.from('orgs').update({ name: editOrgName.trim() }).eq('id', editingOrg.id);
    if (error) { toast({ title: 'Error', description: 'Failed to rename', variant: 'destructive' }); return; }
    toast({ title: 'Renamed', description: editOrgName });
    logAudit('edit_org', 'org', editingOrg.id, editOrgName.trim());
    setEditingOrg(null);
    fetchOrgs();
  };

  // B4 — cascade pre-count for org delete
  const deleteOrganization = async (id: string, name: string) => {
    const { count } = await supabase.from('states').select('id', { count: 'exact', head: true }).eq('org_id', id);
    const n = count ?? 0;
    openConfirm(`Delete "${name}"`, t('orgDeleteHint', n), async () => {
      const { error } = await supabase.from('orgs').delete().eq('id', id);
      if (error) { toast({ title: 'Error', description: `Failed to delete (${error.message})`, variant: 'destructive' }); return; }
      toast({ title: 'Deleted', description: name });
      logAudit('delete_org', 'org', id, name);
      fetchData();
    });
  };

  // ── School / state handlers ────────────────────────────────────────────────

  const createSchool = async () => {
    if (!newSchoolName.trim() || !selectedOrgForSchool) return;
    const { data, error } = await supabase.from('states').insert({
      name: newSchoolName.trim(),
      org_id: selectedOrgForSchool,
      ...(newSchoolCode.trim() ? { state_code: newSchoolCode.trim() } : {}),
    }).select('id').single();
    if (error) { toast({ title: 'Error', description: 'Failed to create school', variant: 'destructive' }); return; }
    toast({ title: 'School Created', description: newSchoolName });
    logAudit('create_school', 'school', data?.id ?? null, newSchoolName.trim());
    setNewSchoolName(''); setNewSchoolCode(''); setSelectedOrgForSchool('');
    fetchSchools();
  };

  // B1 — edit state
  const openEditState = (s: StateRow) => { setEditingState(s); setEditStateName(s.name); setEditStateCode(s.state_code || ''); };
  const saveState = async () => {
    if (!editingState || !editStateName.trim()) return;
    const { error } = await supabase.from('states').update({
      name: editStateName.trim(),
      state_code: editStateCode.trim() || null,
    }).eq('id', editingState.id);
    if (error) { toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' }); return; }
    toast({ title: 'Updated', description: editStateName });
    logAudit('edit_school', 'school', editingState.id, editStateName.trim());
    setEditingState(null);
    fetchSchools();
  };

  // B4 — cascade pre-count for state delete
  const deleteSchool = async (id: string, name: string) => {
    const tRes = await supabase.from('teachers').select('id', { count: 'exact', head: true }).eq('state_id', id);
    const tCount = tRes.count ?? 0;
    openConfirm(`Delete "${name}"`, t('stateDeleteHint', tCount, 0), async () => {
      const { error } = await supabase.from('states').delete().eq('id', id);
      if (error) { toast({ title: 'Error', description: `Failed to delete (${error.message})`, variant: 'destructive' }); return; }
      toast({ title: 'Deleted', description: name });
      logAudit('delete_school', 'school', id, name);
      Promise.all([fetchSchools(), fetchTeachers(), fetchStudents(), fetchClasses()]);
    });
  };

  // ── Classes handlers (B3) ──────────────────────────────────────────────────

  const createClass = async () => {
    if (!newClassName.trim() || !selectedStateForClass) return;
    const { data, error } = await supabase.from('classes').insert({ name: newClassName.trim(), state_id: selectedStateForClass }).select('id').single();
    if (error) { toast({ title: 'Error', description: 'Failed to create class', variant: 'destructive' }); return; }
    toast({ title: 'Class Created', description: newClassName });
    logAudit('create_class', 'class', data?.id ?? null, newClassName.trim());
    setNewClassName(''); setSelectedStateForClass('');
    fetchClasses();
  };

  const deleteClass = async (id: string, name: string) => {
    openConfirm(`${t('deleteClassConfirm')}`, `"${name}"`, async () => {
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (error) { toast({ title: 'Error', description: `Failed to delete (${error.message})`, variant: 'destructive' }); return; }
      toast({ title: 'Deleted', description: name });
      logAudit('delete_class', 'class', id, name);
      setClasses(prev => prev.filter(c => c.id !== id));
    });
  };

  // ── Teacher deactivate (A3) ────────────────────────────────────────────────

  const toggleTeacherActive = async (teacher: Teacher) => {
    const { error } = await supabase.from('teachers').update({ is_active: !teacher.is_active }).eq('id', teacher.id);
    if (error) { toast({ title: 'Error', description: 'Failed to update teacher status', variant: 'destructive' }); return; }
    setTeachers(prev => prev.map(t => t.id === teacher.id ? { ...t, is_active: !t.is_active } : t));
  };

  // ── Student import (A4) ────────────────────────────────────────────────────

  const openImportForTeacher = async () => {
    const teacher = teachers.find(t => t.id === selectedTeacherForImport);
    if (!teacher) return;
    const { data } = await supabase.from('classes').select('id, name').eq('state_id', teacher.state_id);
    const formatted = (data || []).map(c => ({ class_id: c.id, class_name: c.name }));
    setImportClasses(formatted);
    setImportTeacher(teacher);
    setSelectTeacherOpen(false);
    setImportDialogOpen(true);
  };

  // ── User management ────────────────────────────────────────────────────────

  const openEditUser = (u: AdminUser) => { setEditingUser(u); setEditName(u.full_name); setEditLang(u.preferred_language || 'en'); };

  const saveUser = async () => {
    if (!editingUser) return;
    const { error } = await supabase.from('users').update({ full_name: editName.trim(), preferred_language: editLang }).eq('id', editingUser.id);
    if (error) { toast({ title: 'Error', description: 'Failed to update user', variant: 'destructive' }); return; }
    toast({ title: 'User Updated', description: editName });
    logAudit('edit_user', 'user', editingUser.id, editName.trim());
    setEditingUser(null);
    fetchUsers();
  };

  const promoteToAdmin = async (u: AdminUser) => {
    openConfirm(t('promoteAdmin'), t('promoteAdminConfirm'), async () => {
      const { error } = await supabase.from('users').update({ role: 'admin' }).eq('id', u.id);
      if (error) { toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' }); return; }
      toast({ title: 'Role Updated', description: `${u.full_name} is now an Admin` });
      logAudit('promote_admin', 'user', u.id, u.full_name);
      fetchUsers();
    }, t('promoteBtn'));
  };

  // ── Assessment template handlers (C1/C2) ───────────────────────────────────

  const openEditTemplate = (tpl: TemplateRow) => {
    setEditingTemplate(tpl);
    setEditTplTitle(tpl.title); setEditTplDesc(tpl.description || '');
    setEditTplInstr(tpl.instructions || ''); setEditTplActive(tpl.is_active);
  };

  const saveTemplate = async () => {
    if (!editingTemplate) return;
    const ok = await AssessmentService.updateAssessmentTemplate(editingTemplate.id, {
      title: editTplTitle.trim() || undefined,
      description: editTplDesc.trim() || undefined,
      instructions: editTplInstr.trim() || undefined,
      is_active: editTplActive,
    });
    if (!ok) { toast({ title: 'Error', description: 'Failed to update template', variant: 'destructive' }); return; }
    aiSummaryService.clearTemplateCache(editingTemplate.assessment_type); // C6
    toast({ title: 'Template Updated', description: editTplTitle });
    setAssessmentTemplates(prev => prev.map(tp =>
      tp.id === editingTemplate.id
        ? { ...tp, title: editTplTitle.trim(), description: editTplDesc.trim() || null, instructions: editTplInstr.trim() || null, is_active: editTplActive }
        : tp
    ));
    setEditingTemplate(null);
  };

  // ── Summary template handlers (C3/C5/C6) ──────────────────────────────────

  const toggleSummaryTemplateActive = async (tpl: SummaryTemplateRow) => {
    const { error } = await supabase.from('assessment_summary_templates').update({ is_active: !tpl.is_active }).eq('id', tpl.id);
    if (error) { toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' }); return; }
    aiSummaryService.clearTemplateCache(tpl.assessment_type); // C6
    setSummaryTemplates(prev => prev.map(s => s.id === tpl.id ? { ...s, is_active: !s.is_active } : s));
  };

  // C5 — edit summary_questions JSONB
  const openEditSummaryTpl = async (tpl: SummaryTemplateRow) => {
    const { data } = await supabase.from('assessment_summary_templates').select('summary_questions').eq('id', tpl.id).single();
    setEditingSummaryTpl(tpl);
    setEditSummaryJson(JSON.stringify(data?.summary_questions ?? {}, null, 2));
  };

  const saveSummaryTemplate = async () => {
    if (!editingSummaryTpl) return;
    let parsed: unknown;
    try { parsed = JSON.parse(editSummaryJson); } catch {
      toast({ title: 'Error', description: t('jsonParseError'), variant: 'destructive' }); return;
    }
    const { error } = await supabase.from('assessment_summary_templates')
      .update({ summary_questions: parsed as Record<string, unknown> })
      .eq('id', editingSummaryTpl.id);
    if (error) { toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' }); return; }
    aiSummaryService.clearTemplateCache(editingSummaryTpl.assessment_type); // C6
    toast({ title: 'Saved', description: editingSummaryTpl.assessment_type });
    setEditingSummaryTpl(null);
  };

  // ── Media source handlers (D1/D4) ─────────────────────────────────────────

  const loadMediaSources = async () => {
    if (!selectedAssessmentForMedia) return;
    setMediaLoading(true);
    const sources = await AssessmentService.getMediaSources(selectedAssessmentForMedia);
    setMediaForAssessment(sources as MediaSourceRow[]);
    setMediaLoading(false);
  };

  const addMediaSource = async () => {
    if (!selectedAssessmentForMedia || !newMediaTitle.trim() || !newMediaUrl.trim()) return;
    if (!isValidUrl(newMediaUrl)) { toast({ title: 'Error', description: t('invalidUrl'), variant: 'destructive' }); return; } // D4
    const id = await AssessmentService.upsertMediaSource(selectedAssessmentForMedia, {
      title: newMediaTitle.trim(), url: newMediaUrl.trim(),
      description: newMediaDesc.trim() || undefined, sequence_number: newMediaSeq,
    });
    if (!id) { toast({ title: 'Error', description: 'Failed to add media source', variant: 'destructive' }); return; }
    toast({ title: 'Media Added', description: newMediaTitle });
    setNewMediaTitle(''); setNewMediaUrl(''); setNewMediaDesc(''); setNewMediaSeq(0);
    loadMediaSources();
  };

  const deleteMediaSource = async (id: string, title: string) => {
    openConfirm(t('deleteConfirm'), title, async () => {
      const { error } = await supabase.from('assessment_media_sources').delete().eq('id', id);
      if (error) { toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' }); return; }
      toast({ title: 'Deleted', description: title });
      setMediaForAssessment(prev => prev.filter(m => m.id !== id));
    });
  };

  // ── Inspiration sources (D2/D4) ────────────────────────────────────────────

  const loadInspSources = async () => {
    const q = supabase.from('inspiration_sources').select('id, title, url, description, sequence_number, lang').order('lang').order('sequence_number');
    const { data, error } = inspLang === 'all' ? await q : await q.eq('lang', inspLang);
    if (error) { toast({ title: 'Error', description: 'Failed to load inspiration sources', variant: 'destructive' }); return; }
    setInspSources(data as InspirationSource[] || []);
  };

  useEffect(() => { loadInspSources(); }, [inspLang]);

  const addInspSource = async () => {
    if (!newInspTitle.trim() || !newInspUrl.trim()) return;
    if (!isValidUrl(newInspUrl)) { toast({ title: 'Error', description: t('invalidUrl'), variant: 'destructive' }); return; } // D4
    const { error } = await supabase.from('inspiration_sources').insert({
      title: newInspTitle.trim(), url: newInspUrl.trim(), lang: newInspLang, sequence_number: newInspSeq,
    });
    if (error) { toast({ title: 'Error', description: `Failed to add (${error.message})`, variant: 'destructive' }); return; }
    toast({ title: 'Added', description: newInspTitle });
    setNewInspTitle(''); setNewInspUrl(''); setNewInspSeq(1);
    loadInspSources();
  };

  const deleteInspSource = async (id: string, title: string) => {
    openConfirm(t('deleteConfirm'), title, async () => {
      const { error } = await supabase.from('inspiration_sources').delete().eq('id', id);
      if (error) { toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' }); return; }
      toast({ title: 'Deleted', description: title });
      setInspSources(prev => prev.filter(s => s.id !== id));
    });
  };

  // ── Content translations (C4) ──────────────────────────────────────────────

  const loadContentTranslations = async () => {
    if (!ctResourceType.trim()) return;
    const { data, error } = await supabase.from('content_translations')
      .select('id, resource_type, resource_key, lang, text')
      .eq('resource_type', ctResourceType.trim())
      .order('resource_key').order('lang').limit(200);
    if (error) { toast({ title: 'Error', description: `Failed to load (${error.message})`, variant: 'destructive' }); return; }
    setCtRows(data as ContentTranslationRow[] || []);
    setCtEditValues({});
  };

  const saveCtRow = async (row: ContentTranslationRow) => {
    const newText = ctEditValues[row.id];
    if (newText === undefined || newText === row.text) return;
    const { error } = await supabase.from('content_translations').update({ text: newText }).eq('id', row.id);
    if (error) { toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' }); return; }
    setCtRows(prev => prev.map(r => r.id === row.id ? { ...r, text: newText } : r));
    setCtEditValues(prev => { const n = { ...prev }; delete n[row.id]; return n; });
    toast({ title: 'Saved', description: row.resource_key });
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex flex-row justify-between items-center gap-4">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">{t('adminDashboard')}</h1>
            <p className="text-sm md:text-base text-muted-foreground truncate hidden md:block">{t('adminPanel')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" title={t('myProfile')} onClick={() => setProfileDialogOpen(true)}>
              <UserCircle className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">{t('myProfile')}</span>
            </Button>
            <Button variant="outline" onClick={signOut} size="sm" className="whitespace-nowrap">
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{t('signOut')}</span>
              <span className="sm:hidden">Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-5 mb-8">
          {[
            { label: t('organizations'), count: organizations.length, sub: null, icon: <School className="h-4 w-4 text-muted-foreground" /> },
            { label: t('schools'), count: states.length, sub: null, icon: <School className="h-4 w-4 text-muted-foreground" /> },
            { label: t('teachers'), count: teachers.filter(t => t.is_active).length, sub: `${teachers.length} total`, icon: <Users className="h-4 w-4 text-muted-foreground" /> },
            { label: t('students'), count: students.filter(s => s.enrollment_status === 'active' || !s.enrollment_status).length, sub: `${students.length} total`, icon: <BookOpen className="h-4 w-4 text-muted-foreground" /> },
          ].map(({ label, count, sub, icon }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>{icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
              </CardContent>
            </Card>
          ))}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 to-teal-100 col-span-2 md:col-span-1">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-600 text-xs md:text-sm font-medium">{t('underIlp')}</p>
                  <p className="text-2xl md:text-3xl font-bold text-teal-800">{students.filter(s => s.teachers?.is_default).length}</p>
                </div>
                <Users className="w-6 h-6 md:w-8 md:h-8 text-teal-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={tab => {
            setActiveTab(tab);
            const params = new URLSearchParams(location.search);
            params.set('tab', tab);
            window.history.replaceState(null, '', `${location.pathname}?${params.toString()}`);
          }}
          className="space-y-6"
        >
          <div className="overflow-x-auto pb-2 -mx-1 px-1">
            <TabsList className="flex w-fit md:grid md:w-full md:grid-cols-7 min-w-max">
              <TabsTrigger value="organizations">{t('tabs_orgs')}</TabsTrigger>
              <TabsTrigger value="states">{t('tabs_states')}</TabsTrigger>
              <TabsTrigger value="teachers">{t('tabs_teachers')}</TabsTrigger>
              <TabsTrigger value="students">{t('tabs_students')}</TabsTrigger>
              <TabsTrigger value="reports">{t('tabs_reports')}</TabsTrigger>
              <TabsTrigger value="users">{t('tabs_users')}</TabsTrigger>
              <TabsTrigger value="content">{t('tabs_content')}</TabsTrigger>
            </TabsList>
          </div>

          {/* ── Organizations ────────────────────────────────────────────── */}
          <TabsContent value="organizations" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>{t('createOrg')}</CardTitle><CardDescription>{t('createOrgDesc')}</CardDescription></CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input className="flex-1" placeholder={t('orgNamePh')} value={newOrgName} onChange={e => setNewOrgName(e.target.value)} />
                  <Button onClick={createOrganization} disabled={!newOrgName.trim()} className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />{t('createBtn')}
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{t('orgsTitle')}</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Created</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {organizations.map(org => (
                        <TableRow key={org.id}>
                          <TableCell className="font-medium">{org.name}</TableCell>
                          <TableCell>{new Date(org.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" title="Rename" onClick={() => openEditOrg(org)}><Edit className="w-4 h-4" /></Button>
                              <Button variant="destructive" size="sm" title="Delete" onClick={() => deleteOrganization(org.id, org.name)}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {organizations.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-sm text-muted-foreground">{t('noData')}</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Schools + Classes ────────────────────────────────────────── */}
          <TabsContent value="states" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>{t('createSchool')}</CardTitle><CardDescription>{t('createSchoolDesc')}</CardDescription></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Input placeholder={t('schoolNamePh')} value={newSchoolName} onChange={e => setNewSchoolName(e.target.value)} />
                  <Input placeholder={t('stateCodePh')} value={newSchoolCode} onChange={e => setNewSchoolCode(e.target.value)} />
                  <Select value={selectedOrgForSchool} onValueChange={setSelectedOrgForSchool}>
                    <SelectTrigger><SelectValue placeholder={t('selectOrg')} /></SelectTrigger>
                    <SelectContent>{organizations.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button onClick={createSchool} disabled={!newSchoolName.trim() || !selectedOrgForSchool}>
                    <Plus className="w-4 h-4 mr-2" />{t('createBtn')}
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{t('schools')}</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Name</TableHead><TableHead>{t('stateCodeLabel')}</TableHead>
                      <TableHead>Organization</TableHead><TableHead>Created</TableHead><TableHead>Actions</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {states.map(s => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{s.state_code || '—'}</TableCell>
                          <TableCell>{s.orgs?.name}</TableCell>
                          <TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" title="Edit" onClick={() => openEditState(s)}><Edit className="w-4 h-4" /></Button>
                              <Button variant="destructive" size="sm" title="Delete" onClick={() => deleteSchool(s.id, s.name)}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {states.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground">{t('noData')}</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* B3 — Classes */}
            <Card>
              <CardHeader><CardTitle>{t('classesTitle')}</CardTitle><CardDescription>{t('classesDesc')}</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input className="flex-1" placeholder={t('classNamePh')} value={newClassName} onChange={e => setNewClassName(e.target.value)} />
                  <Select value={selectedStateForClass} onValueChange={setSelectedStateForClass}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder={t('selectState')} /></SelectTrigger>
                    <SelectContent>{states.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button onClick={createClass} disabled={!newClassName.trim() || !selectedStateForClass} className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />{t('addClass')}
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>School</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {classes.map(c => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell>{c.states?.name}</TableCell>
                          <TableCell>
                            <Button variant="destructive" size="sm" title="Delete" onClick={() => deleteClass(c.id, c.name)}><Trash2 className="w-4 h-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {classes.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-sm text-muted-foreground">{t('noData')}</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Teachers (A3 / A7) ───────────────────────────────────────── */}
          <TabsContent value="teachers" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>{t('teachers')}</CardTitle><CardDescription>{t('teacherDesc')}</CardDescription></CardHeader>
              <CardContent>
                <div className="mb-3">
                  <Input
                    placeholder={t('searchTeachers')}
                    value={teacherSearch}
                    onChange={e => setTeacherSearch(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Name</TableHead><TableHead>Mobile</TableHead>
                      <TableHead>School</TableHead><TableHead>Class</TableHead>
                      <TableHead>Status</TableHead><TableHead>Actions</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {(() => {
                        const filtered = teachers.filter(teacher => {
                          if (!teacherSearch.trim()) return true;
                          const q = teacherSearch.toLowerCase();
                          return teacher.users?.full_name?.toLowerCase().includes(q) ||
                            teacher.states?.name?.toLowerCase().includes(q) ||
                            teacher.users?.mobile?.includes(q);
                        });
                        if (filtered.length === 0) return (
                          <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">{t('noData')}</TableCell></TableRow>
                        );
                        return filtered.map(teacher => (
                          <TableRow key={teacher.id}>
                            <TableCell className="font-medium whitespace-nowrap">{teacher.users?.full_name}</TableCell>
                            <TableCell className="whitespace-nowrap">{teacher.users?.mobile}</TableCell>
                            <TableCell className="whitespace-nowrap">{teacher.states?.name}</TableCell>
                            <TableCell className="whitespace-nowrap">{teacher.classes?.name || t('unassigned')}</TableCell>
                            <TableCell>
                              <Badge variant={teacher.is_active ? 'secondary' : 'outline'}>
                                {teacher.is_active ? t('active') : t('inactive')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" onClick={() => toggleTeacherActive(teacher)}>
                                {teacher.is_active ? t('deactivate') : t('activate')}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ));
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Students (A4) ────────────────────────────────────────────── */}
          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle>{t('students')}</CardTitle>
                    <CardDescription>{t('studentDesc')}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectTeacherOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />{t('importStudents')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                  <Input
                    placeholder={t('searchStudents')}
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    className="max-w-sm"
                  />
                  <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors whitespace-nowrap">
                    <input type="checkbox" checked={showMentorOnly} onChange={e => setShowMentorOnly(e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary" />
                    {t('mentorOnly')}
                  </label>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Name</TableHead><TableHead>Mobile</TableHead>
                      <TableHead>School</TableHead><TableHead>Class</TableHead>
                      <TableHead>Teacher</TableHead><TableHead>Status</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {(() => {
                        const filtered = (showMentorOnly ? students.filter(s => s.teachers?.is_default) : students)
                          .filter(student => {
                            if (!studentSearch.trim()) return true;
                            const q = studentSearch.toLowerCase();
                            return student.users?.full_name?.toLowerCase().includes(q) ||
                              student.users?.mobile?.includes(q) ||
                              student.classes?.states?.name?.toLowerCase().includes(q) ||
                              student.teachers?.users?.full_name?.toLowerCase().includes(q);
                          });
                        if (filtered.length === 0) return (
                          <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">{t('noData')}</TableCell></TableRow>
                        );
                        return filtered.map(student => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium whitespace-nowrap">{student.users?.full_name}</TableCell>
                            <TableCell className="whitespace-nowrap">{student.users?.mobile}</TableCell>
                            <TableCell className="whitespace-nowrap">{student.classes?.states?.name}</TableCell>
                            <TableCell className="whitespace-nowrap">{student.classes?.name}</TableCell>
                            <TableCell className="whitespace-nowrap">{student.teachers?.users?.full_name}</TableCell>
                            <TableCell>
                              <Badge variant={
                                student.enrollment_status === 'active' ? 'secondary' :
                                student.enrollment_status === 'graduated' ? 'default' :
                                'outline'
                              }>
                                {student.enrollment_status || 'active'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ));
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Reports ──────────────────────────────────────────────────── */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>{t('reports')}</CardTitle><CardDescription>{t('reportsDesc')}</CardDescription></CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="border shadow-sm">
                    <CardHeader><CardTitle className="text-base">Students under ILP Mentor by State</CardTitle></CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader><TableRow><TableHead>State</TableHead><TableHead className="text-right">Count</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {(() => {
                            const byState: Record<string, number> = {};
                            students.filter(s => s.teachers?.is_default).forEach(s => {
                              const key = s.classes?.states?.name || '—';
                              byState[key] = (byState[key] || 0) + 1;
                            });
                            const rows = Object.entries(byState).sort((a, b) => a[0].localeCompare(b[0]));
                            return rows.length ? rows.map(([state, count]) => (
                              <TableRow key={state}><TableCell className="font-medium">{state}</TableCell><TableCell className="text-right">{count}</TableCell></TableRow>
                            )) : <TableRow><TableCell colSpan={2} className="text-center text-sm text-muted-foreground">{t('noData')}</TableCell></TableRow>;
                          })()}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                  <Card className="border shadow-sm">
                    <CardHeader><CardTitle className="text-base">Overview</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>Under ILP Mentor</span><span className="font-medium">{students.filter(s => s.teachers?.is_default).length}</span></div>
                      <div className="flex justify-between"><span>Total Students</span><span className="font-medium">{students.length}</span></div>
                      <div className="flex justify-between"><span>Active Teachers</span><span className="font-medium">{teachers.filter(t => t.is_active).length}</span></div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Audit Log */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('auditLog')}</CardTitle>
                    <CardDescription>{t('auditLogDesc')}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchAuditLogs} disabled={auditLoading}>
                    {auditLoading ? '...' : t('loadAudit')}
                  </Button>
                </div>
              </CardHeader>
              {auditLogs.length > 0 && (
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>{t('auditWhen')}</TableHead>
                        <TableHead>{t('auditAction')}</TableHead>
                        <TableHead>{t('auditTarget')}</TableHead>
                        <TableHead>{t('auditActor')}</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {auditLogs.map(log => (
                          <TableRow key={log.id}>
                            <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                              {new Date(log.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell className="font-mono text-xs">{log.action}</TableCell>
                            <TableCell className="text-sm">
                              <span className="font-medium">{log.target_name || log.target_id || '—'}</span>
                              <span className="text-muted-foreground text-xs ml-1">({log.target_type})</span>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {adminUsers.find(u => u.id === log.actor_user_id)?.full_name || (log.actor_user_id ? log.actor_user_id.slice(0, 8) + '…' : '—')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Profile Picture Orphan Check */}
            <Card>
              <CardHeader>
                <CardTitle>{t('profilePicCheck')}</CardTitle>
                <CardDescription>{t('profilePicCheckDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-8 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{adminUsers.filter(u => u.profile_picture_url).length}</p>
                    <p className="text-xs text-muted-foreground">{t('withPic')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-muted-foreground">{adminUsers.filter(u => !u.profile_picture_url).length}</p>
                    <p className="text-xs text-muted-foreground">{t('withoutPic')}</p>
                  </div>
                </div>
                {adminUsers.filter(u => u.profile_picture_url).length > 0 && (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>{t('name')}</TableHead>
                        <TableHead>{t('role')}</TableHead>
                        <TableHead>{t('profilePicture')} URL</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {adminUsers.filter(u => u.profile_picture_url).map(u => (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium text-sm whitespace-nowrap">{u.full_name}</TableCell>
                            <TableCell><Badge variant="outline" className="text-xs">{u.role}</Badge></TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{u.profile_picture_url}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Users ────────────────────────────────────────────────────── */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>{t('usersTitle')}</CardTitle><CardDescription>{t('usersDesc')}</CardDescription></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>{t('name')}</TableHead><TableHead>{t('email')}</TableHead>
                      <TableHead>{t('role')}</TableHead><TableHead>{t('language')}</TableHead>
                      <TableHead>{t('mobile')}</TableHead>
                      <TableHead className="text-center">{t('profilePicture')}</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {adminUsers.map(u => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium whitespace-nowrap">{u.full_name}</TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground text-sm">{u.email}</TableCell>
                          <TableCell><Badge variant={u.role === 'admin' ? 'default' : u.role === 'teacher' ? 'secondary' : 'outline'}>{u.role}</Badge></TableCell>
                          <TableCell className="uppercase text-xs">{u.preferred_language || 'en'}</TableCell>
                          <TableCell className="whitespace-nowrap">{u.mobile || '—'}</TableCell>
                          <TableCell className="text-center text-sm">{u.profile_picture_url ? '✓' : '—'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => openEditUser(u)}><Edit className="w-4 h-4" /></Button>
                              {u.role !== 'admin' && (
                                <Button variant="outline" size="sm" className="text-xs whitespace-nowrap" onClick={() => promoteToAdmin(u)}>{t('promoteAdmin')}</Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Content ──────────────────────────────────────────────────── */}
          <TabsContent value="content" className="space-y-6">

            {/* Assessment Templates */}
            <Card>
              <CardHeader><CardTitle>{t('assessmentTemplates')}</CardTitle><CardDescription>{t('assessmentTemplatesDesc')}</CardDescription></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>{t('title')}</TableHead><TableHead>{t('active')}</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {assessmentTemplates.map(tpl => (
                        <TableRow key={tpl.id}>
                          <TableCell className="font-mono text-xs whitespace-nowrap">{tpl.assessment_type}</TableCell>
                          <TableCell className="whitespace-nowrap">{tpl.title}</TableCell>
                          <TableCell><Badge variant={tpl.is_active ? 'default' : 'secondary'}>{tpl.is_active ? t('active') : t('inactive')}</Badge></TableCell>
                          <TableCell><Button variant="outline" size="sm" onClick={() => openEditTemplate(tpl)}><Edit className="w-4 h-4" /></Button></TableCell>
                        </TableRow>
                      ))}
                      {assessmentTemplates.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground">{t('noData')}</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Summary Templates (C3/C5) */}
            <Card>
              <CardHeader><CardTitle>{t('summaryTemplates')}</CardTitle><CardDescription>{t('summaryTemplatesDesc')}</CardDescription></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>{t('title')}</TableHead><TableHead>{t('active')}</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {summaryTemplates.map(tpl => (
                        <TableRow key={tpl.id}>
                          <TableCell className="font-mono text-xs whitespace-nowrap">{tpl.assessment_type}</TableCell>
                          <TableCell className="whitespace-nowrap">{tpl.title}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch checked={tpl.is_active} onCheckedChange={() => toggleSummaryTemplateActive(tpl)} />
                              <span className="text-xs text-muted-foreground">{tpl.is_active ? t('active') : t('inactive')}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => openEditSummaryTpl(tpl)}><Edit className="w-4 h-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {summaryTemplates.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground">{t('noData')}</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Media Sources (D1/D4) */}
            <Card>
              <CardHeader><CardTitle>{t('mediaSources')}</CardTitle><CardDescription>{t('mediaSourcesDesc')}</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select value={selectedAssessmentForMedia} onValueChange={setSelectedAssessmentForMedia}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder={t('selectAssessment')} /></SelectTrigger>
                    <SelectContent>{ASSESSMENT_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="outline" onClick={loadMediaSources} disabled={!selectedAssessmentForMedia || mediaLoading} className="w-full sm:w-auto">{t('loadMedia')}</Button>
                </div>
                {selectedAssessmentForMedia && (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader><TableRow><TableHead>{t('title')}</TableHead><TableHead>URL</TableHead><TableHead>{t('mediaSeq')}</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {mediaForAssessment.map(m => (
                            <TableRow key={m.id}>
                              <TableCell className="font-medium whitespace-nowrap">{m.title}</TableCell>
                              <TableCell className="max-w-xs truncate text-muted-foreground text-xs">{m.url}</TableCell>
                              <TableCell>{m.sequence_number}</TableCell>
                              <TableCell><Button variant="destructive" size="sm" onClick={() => deleteMediaSource(m.id, m.title)}><Trash2 className="w-4 h-4" /></Button></TableCell>
                            </TableRow>
                          ))}
                          {mediaForAssessment.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground">{t('noData')}</TableCell></TableRow>}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                      <p className="text-sm font-medium">{t('addMedia')}</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input placeholder={t('mediaTitle')} value={newMediaTitle} onChange={e => setNewMediaTitle(e.target.value)} />
                        <Input placeholder={t('mediaUrl')} value={newMediaUrl} onChange={e => setNewMediaUrl(e.target.value)} />
                        <Input placeholder={t('mediaDesc')} value={newMediaDesc} onChange={e => setNewMediaDesc(e.target.value)} />
                        <Input type="number" placeholder={t('mediaSeq')} value={newMediaSeq} onChange={e => setNewMediaSeq(parseInt(e.target.value) || 0)} />
                      </div>
                      <Button onClick={addMediaSource} disabled={!newMediaTitle.trim() || !newMediaUrl.trim()} className="w-full sm:w-auto">
                        <Plus className="w-4 h-4 mr-2" />{t('addMedia')}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Inspiration Videos (D2/D4) */}
            <Card>
              <CardHeader><CardTitle>{t('inspVideosTitle')}</CardTitle><CardDescription>{t('inspVideosDesc')}</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Label>{t('langFilterLabel')}</Label>
                  <Select value={inspLang} onValueChange={setInspLang}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('langAll')}</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="kn">ಕನ್ನಡ</SelectItem>
                      <SelectItem value="ta">தமிழ்</SelectItem>
                      <SelectItem value="hi">हिन्दी</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow><TableHead>{t('title')}</TableHead><TableHead>URL</TableHead><TableHead>Lang</TableHead><TableHead>Order</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {inspSources.map(s => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium whitespace-nowrap">{s.title}</TableCell>
                          <TableCell className="max-w-xs truncate text-muted-foreground text-xs">{s.url}</TableCell>
                          <TableCell className="uppercase text-xs">{s.lang}</TableCell>
                          <TableCell>{s.sequence_number}</TableCell>
                          <TableCell><Button variant="destructive" size="sm" onClick={() => deleteInspSource(s.id, s.title)}><Trash2 className="w-4 h-4" /></Button></TableCell>
                        </TableRow>
                      ))}
                      {inspSources.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground">{t('noData')}</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </div>
                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <p className="text-sm font-medium">{t('addVideo')}</p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Input placeholder={t('videoTitlePh')} value={newInspTitle} onChange={e => setNewInspTitle(e.target.value)} />
                    <Input placeholder={t('videoUrlPh')} value={newInspUrl} onChange={e => setNewInspUrl(e.target.value)} />
                    <Select value={newInspLang} onValueChange={setNewInspLang}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="kn">ಕನ್ನಡ</SelectItem>
                        <SelectItem value="ta">தமிழ்</SelectItem>
                        <SelectItem value="hi">हिन्दी</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" placeholder="Order" value={newInspSeq} onChange={e => setNewInspSeq(parseInt(e.target.value) || 1)} />
                  </div>
                  <Button onClick={addInspSource} disabled={!newInspTitle.trim() || !newInspUrl.trim()} className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />{t('addVideo')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Counselling Resources (D3) */}
            <Card>
              <CardHeader><CardTitle>{t('resourcesTitle')}</CardTitle></CardHeader>
              <CardContent><ResourceManager /></CardContent>
            </Card>

            {/* Content Translations (C4) */}
            <Card>
              <CardHeader><CardTitle>{t('ctTitle')}</CardTitle><CardDescription>{t('ctDesc')}</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input className="flex-1" placeholder={t('ctResourceType')} value={ctResourceType} onChange={e => setCtResourceType(e.target.value)} />
                  <Button variant="outline" onClick={loadContentTranslations} disabled={!ctResourceType.trim()} className="w-full sm:w-auto">{t('ctLoad')}</Button>
                </div>
                {ctRows.length > 0 && (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow><TableHead>{t('ctKey')}</TableHead><TableHead>{t('ctLang')}</TableHead><TableHead>{t('ctValue')}</TableHead><TableHead>Save</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {ctRows.map(row => (
                          <TableRow key={row.id}>
                            <TableCell className="font-mono text-xs whitespace-nowrap">{row.resource_key}</TableCell>
                            <TableCell className="uppercase text-xs">{row.lang}</TableCell>
                            <TableCell>
                              <Textarea
                                className="min-h-[60px] text-sm"
                                value={ctEditValues[row.id] ?? row.text}
                                onChange={e => setCtEditValues(prev => ({ ...prev, [row.id]: e.target.value }))}
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm" variant="outline"
                                disabled={!ctEditValues[row.id] || ctEditValues[row.id] === row.text}
                                onClick={() => saveCtRow(row)}
                              >{t('ctSaveRow')}</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {ctRows.length === 0 && ctResourceType && <p className="text-sm text-muted-foreground">{t('noData')}</p>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}

      {/* B1 — Rename org */}
      <Dialog open={!!editingOrg} onOpenChange={open => !open && setEditingOrg(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('renameOrgTitle')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>{t('name')}</Label>
            <Input value={editOrgName} onChange={e => setEditOrgName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingOrg(null)}>{t('cancel')}</Button>
            <Button onClick={saveOrg} disabled={!editOrgName.trim()}>{t('saveChanges')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* B1/B2 — Edit state */}
      <Dialog open={!!editingState} onOpenChange={open => !open && setEditingState(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('renameStateTitle')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>{t('name')}</Label><Input value={editStateName} onChange={e => setEditStateName(e.target.value)} className="mt-1" /></div>
            <div><Label>{t('stateCodeLabel')}</Label><Input value={editStateCode} onChange={e => setEditStateCode(e.target.value)} className="mt-1" placeholder="e.g. KA" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingState(null)}>{t('cancel')}</Button>
            <Button onClick={saveState} disabled={!editStateName.trim()}>{t('saveChanges')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* A4 — Select teacher for import */}
      <Dialog open={selectTeacherOpen} onOpenChange={setSelectTeacherOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('selectTeacherImport')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={selectedTeacherForImport} onValueChange={setSelectedTeacherForImport}>
              <SelectTrigger><SelectValue placeholder={t('selectTeacherPh')} /></SelectTrigger>
              <SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.users?.full_name} — {t.states?.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectTeacherOpen(false)}>{t('cancel')}</Button>
            <Button onClick={openImportForTeacher} disabled={!selectedTeacherForImport}>{t('importStudents')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* A4 — ImportStudentsDialog */}
      {importTeacher && (
        <ImportStudentsDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          classes={importClasses}
          teacherId={importTeacher.id}
          stateId={importTeacher.state_id}
          onImported={() => { setImportDialogOpen(false); setImportTeacher(null); fetchStudents(); }}
        />
      )}

      {/* B5 — Shared confirm dialog (replaces window.confirm) */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={open => !open && setConfirmDialog(prev => ({ ...prev, open: false }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            {confirmDialog.description && (
              <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmDialog(prev => ({ ...prev, open: false }));
                confirmDialog.onConfirm();
              }}
            >
              {confirmDialog.confirmLabel || t('confirmBtn')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* E7 — Admin profile dialog */}
      <ProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} />

      {/* User edit */}
      <Dialog open={!!editingUser} onOpenChange={open => !open && setEditingUser(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t('editUser')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{t('name')}</Label><Input value={editName} onChange={e => setEditName(e.target.value)} className="mt-1" /></div>
            <div><Label>{t('email')}</Label><Input value={editingUser?.email || ''} disabled className="bg-muted mt-1" /></div>
            <div><Label>{t('role')}</Label><Input value={editingUser?.role || ''} disabled className="bg-muted mt-1" /></div>
            <div>
              <Label>{t('language')}</Label>
              <Select value={editLang} onValueChange={setEditLang}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="kn">ಕನ್ನಡ</SelectItem>
                  <SelectItem value="ta">தமிழ்</SelectItem>
                  <SelectItem value="hi">हिन्दी</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Read-only profile columns surfaced for admin visibility */}
            {editingUser && (editingUser.date_of_birth || editingUser.gender || editingUser.address ||
              editingUser.school || editingUser.bio || editingUser.interests ||
              editingUser.career_goals || editingUser.strengths || editingUser.areas_for_growth ||
              editingUser.profile_picture_url) && (
              <div className="pt-3 border-t space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Profile Information</p>
                {editingUser.date_of_birth && (
                  <div><p className="text-xs text-muted-foreground">{t('dob')}</p><p className="text-sm">{editingUser.date_of_birth}</p></div>
                )}
                {editingUser.gender && (
                  <div><p className="text-xs text-muted-foreground">{t('genderLabel')}</p><p className="text-sm">{editingUser.gender}</p></div>
                )}
                {editingUser.address && (
                  <div><p className="text-xs text-muted-foreground">{t('addressLabel')}</p><p className="text-sm whitespace-pre-wrap">{editingUser.address}</p></div>
                )}
                {editingUser.school && (
                  <div><p className="text-xs text-muted-foreground">{t('schoolLabel')}</p><p className="text-sm">{editingUser.school}</p></div>
                )}
                {editingUser.bio && (
                  <div><p className="text-xs text-muted-foreground">{t('bio')}</p><p className="text-sm whitespace-pre-wrap">{editingUser.bio}</p></div>
                )}
                {editingUser.interests && (
                  <div><p className="text-xs text-muted-foreground">{t('interests')}</p><p className="text-sm">{editingUser.interests}</p></div>
                )}
                {editingUser.career_goals && (
                  <div><p className="text-xs text-muted-foreground">{t('careerGoals')}</p><p className="text-sm whitespace-pre-wrap">{editingUser.career_goals}</p></div>
                )}
                {editingUser.strengths && (
                  <div><p className="text-xs text-muted-foreground">{t('strengths')}</p><p className="text-sm">{editingUser.strengths}</p></div>
                )}
                {editingUser.areas_for_growth && (
                  <div><p className="text-xs text-muted-foreground">{t('areasForGrowth')}</p><p className="text-sm">{editingUser.areas_for_growth}</p></div>
                )}
                {editingUser.profile_picture_url && (
                  <div><p className="text-xs text-muted-foreground">{t('profilePicture')} URL</p><p className="text-xs text-muted-foreground break-all">{editingUser.profile_picture_url}</p></div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>{t('cancel')}</Button>
            <Button onClick={saveUser} disabled={!editName.trim()}>{t('saveChanges')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assessment template edit (C1/C2) */}
      <Dialog open={!!editingTemplate} onOpenChange={open => !open && setEditingTemplate(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t('editTemplate')}: <span className="font-mono text-sm">{editingTemplate?.assessment_type}</span></DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{t('title')}</Label><Input value={editTplTitle} onChange={e => setEditTplTitle(e.target.value)} className="mt-1" /></div>
            <div><Label>{t('description')}</Label><Textarea value={editTplDesc} onChange={e => setEditTplDesc(e.target.value)} rows={3} className="mt-1" /></div>
            <div><Label>{t('instructions')}</Label><Textarea value={editTplInstr} onChange={e => setEditTplInstr(e.target.value)} rows={4} className="mt-1" /></div>
            <div className="flex items-center gap-3">
              <Switch checked={editTplActive} onCheckedChange={setEditTplActive} id="tpl-active" />
              <Label htmlFor="tpl-active">{t('active')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>{t('cancel')}</Button>
            <Button onClick={saveTemplate}>{t('saveChanges')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summary JSONB edit (C5) */}
      <Dialog open={!!editingSummaryTpl} onOpenChange={open => !open && setEditingSummaryTpl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{t('editSummaryTitle')}: <span className="font-mono text-sm">{editingSummaryTpl?.assessment_type}</span></DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>{t('summaryQuestionsJson')}</Label>
            <Textarea value={editSummaryJson} onChange={e => setEditSummaryJson(e.target.value)} rows={16} className="font-mono text-xs" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSummaryTpl(null)}>{t('cancel')}</Button>
            <Button onClick={saveSummaryTemplate}>{t('saveChanges')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
