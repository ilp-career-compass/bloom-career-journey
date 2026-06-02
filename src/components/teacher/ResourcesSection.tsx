import { useMemo } from 'react';
import { CAREER_PLANNER, COURSE_GUIDANCE_CHART, CAREER_DETAILS, localizeLabel } from '@/data/resources';
import { buildDriveViewUrl, buildDriveDownloadUrl } from '@/utils/driveLinks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, Download, BookOpen, Map, FileText } from 'lucide-react';
import { useLang } from '@/hooks/useLang';

// ── Localised strings ────────────────────────────────────────────────────────
type Lang = 'en' | 'kn' | 'ta' | 'hi';

const STRINGS: Record<Lang, {
  tabCareer: string; tabDetails: string; tabCourse: string;
  titleCareer: string; descCareer: string;
  titleDetails: string; descDetails: string;
  titleCourse: string; descCourse: string;
  open: string; download: string; notConfigured: string;
}> = {
  en: {
    tabCareer: 'Career Planner',
    tabDetails: 'Career Details',
    tabCourse: 'Course Guidance Chart',
    titleCareer: 'Career Planner',
    descCareer: 'Comprehensive booklet containing detailed information about different careers, including educational requirements, job prospects, and industry trends to guide student career planning.',
    titleDetails: 'Career Details',
    descDetails: 'Detailed document outlining specific career information in tabular format, including occupation names, fields, educational qualifications, work environment, and job opportunities.',
    titleCourse: 'Course Guidance Chart',
    descCourse: 'Visual reference chart displaying all available course options and pathways for students after completing their 10th and 12th grade examinations.',
    open: 'Open',
    download: 'Download',
    notConfigured: 'Drive file IDs are not configured yet. Paste them in src/data/resources.ts.',
  },
  kn: {
    tabCareer: 'ವೃತ್ತಿ ಯೋಜಕ',
    tabDetails: 'ವೃತ್ತಿ ವಿವರಗಳು',
    tabCourse: 'ಕೋರ್ಸ್ ಮಾರ್ಗದರ್ಶನ ಚಾರ್ಟ್',
    titleCareer: 'ವೃತ್ತಿ ಯೋಜಕ',
    descCareer: 'ವಿವಿಧ ವೃತ್ತಿಗಳ ಬಗ್ಗೆ ವಿಸ್ತೃತ ಮಾಹಿತಿ ಒಳಗೊಂಡ ಸಮಗ್ರ ಪುಸ್ತಿಕೆ — ಶೈಕ್ಷಣಿಕ ಅರ್ಹತೆಗಳು, ಉದ್ಯೋಗ ನಿರೀಕ್ಷೆಗಳು ಮತ್ತು ಉದ್ಯಮ ಪ್ರವೃತ್ತಿಗಳನ್ನು ಒಳಗೊಂಡಿದೆ.',
    titleDetails: 'ವೃತ್ತಿ ವಿವರಗಳು',
    descDetails: 'ಉದ್ಯೋಗದ ಹೆಸರು, ಕ್ಷೇತ್ರ, ಶೈಕ್ಷಣಿಕ ಅರ್ಹತೆ, ಕೆಲಸದ ವಾತಾವರಣ ಮತ್ತು ಉದ್ಯೋಗ ಅವಕಾಶಗಳನ್ನು ಕೋಷ್ಟಕ ಸ್ವರೂಪದಲ್ಲಿ ಒಳಗೊಂಡ ವಿಸ್ತೃತ ದಾಖಲೆ.',
    titleCourse: 'ಕೋರ್ಸ್ ಮಾರ್ಗದರ್ಶನ ಚಾರ್ಟ್',
    descCourse: '10ನೇ ಮತ್ತು 12ನೇ ತರಗತಿ ನಂತರ ಲಭ್ಯವಿರುವ ಎಲ್ಲಾ ಕೋರ್ಸ್ ಆಯ್ಕೆಗಳನ್ನು ತೋರಿಸುವ ದೃಶ್ಯ ಉಲ್ಲೇಖ ಚಾರ್ಟ್.',
    open: 'ತೆರೆಯಿರಿ',
    download: 'ಡೌನ್‌ಲೋಡ್',
    notConfigured: 'Drive ಫೈಲ್ IDs ಇನ್ನೂ ಕಾನ್ಫಿಗರ್ ಮಾಡಲಾಗಿಲ್ಲ. src/data/resources.ts ನಲ್ಲಿ ಸೇರಿಸಿ.',
  },
  ta: {
    tabCareer: 'தொழில் திட்டமிடல்',
    tabDetails: 'தொழில் விவரங்கள்',
    tabCourse: 'படிப்பு வழிகாட்டல் அட்டவணை',
    titleCareer: 'தொழில் திட்டமிடல்',
    descCareer: 'பல்வேறு தொழில்களைப் பற்றிய விரிவான தகவல்களை உள்ளடக்கிய விரிவான கையேடு — கல்வித் தகுதிகள், வேலை வாய்ப்புகள் மற்றும் தொழில்துறை போக்குகள் உட்பட.',
    titleDetails: 'தொழில் விவரங்கள்',
    descDetails: 'பணி பெயர், துறை, கல்வித் தகுதி, பணிச்சூழல் மற்றும் வேலை வாய்ப்புகள் ஆகியவற்றை அட்டவணை வடிவில் கொண்ட விரிவான ஆவணம்.',
    titleCourse: 'படிப்பு வழிகாட்டல் அட்டவணை',
    descCourse: '10 மற்றும் 12ஆம் வகுப்புக்கு பின் கிடைக்கும் அனைத்து படிப்பு வழிகளையும் காட்டும் காட்சி குறிப்பு அட்டவணை.',
    open: 'திற',
    download: 'பதிவிறக்கு',
    notConfigured: 'Drive கோப்பு IDகள் இன்னும் அமைக்கப்படவில்லை. src/data/resources.ts இல் சேர்க்கவும்.',
  },
  hi: {
    tabCareer: 'करियर प्लानर',
    tabDetails: 'करियर विवरण',
    tabCourse: 'कोर्स मार्गदर्शन चार्ट',
    titleCareer: 'करियर प्लानर',
    descCareer: 'विभिन्न करियर के बारे में विस्तृत जानकारी वाली व्यापक पुस्तिका — शैक्षणिक योग्यताएं, नौकरी की संभावनाएं और उद्योग रुझान सहित।',
    titleDetails: 'करियर विवरण',
    descDetails: 'व्यवसाय के नाम, क्षेत्र, शैक्षणिक योग्यता, कार्य वातावरण और नौकरी के अवसरों को सारणी प्रारूप में प्रस्तुत करने वाला विस्तृत दस्तावेज़।',
    titleCourse: 'कोर्स मार्गदर्शन चार्ट',
    descCourse: '10वीं और 12वीं कक्षा के बाद उपलब्ध सभी कोर्स विकल्पों और मार्गों को दर्शाने वाला दृश्य संदर्भ चार्ट।',
    open: 'खोलें',
    download: 'डाउनलोड',
    notConfigured: 'Drive फ़ाइल IDs अभी कॉन्फ़िगर नहीं हुई हैं। src/data/resources.ts में डालें।',
  },
};

// ── Resource list card ───────────────────────────────────────────────────────
type Item = { id: string; label: string; fileId?: string; externalUrl?: string; [key: string]: any };

interface ResourceListProps {
  title: string;
  description: string;
  items: Item[];
  lang: string;
  openLabel: string;
  downloadLabel: string;
  notConfiguredMsg: string;
}

const ResourceList = ({ title, description, items, lang, openLabel, downloadLabel, notConfiguredMsg }: ResourceListProps) => {
  const hasConfiguredLinks = useMemo(() => items.every(i => !!i.fileId || !!i.externalUrl), [items]);

  const iconType = (() => {
    const isCareer = ['Career Planner', 'ವೃತ್ತಿ ಯೋಜಕ', 'தொழில் திட்டமிடல்', 'करियर प्लानर'].includes(title);
    const isDetails = ['Career Details', 'ವೃತ್ತಿ ವಿವರಗಳು', 'தொழில் விவரங்கள்', 'करियर विवरण'].includes(title);
    return isCareer ? 'planner' : isDetails ? 'details' : 'chart';
  })();

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
          {iconType === 'planner'
            ? <BookOpen className="w-5 h-5 text-indigo-600" />
            : iconType === 'details'
              ? <FileText className="w-5 h-5 text-blue-600" />
              : <Map className="w-5 h-5 text-emerald-600" />}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasConfiguredLinks && (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded">
            {notConfiguredMsg}
          </div>
        )}
        <ul className="space-y-2">
          {items.map(item => (
            <li key={item.id} className="flex items-center justify-between border rounded-md bg-white px-3 py-2">
              <div className="text-blue-700">
                {localizeLabel(item, lang)}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild disabled={!item.fileId && !item.externalUrl}>
                  <a href={item.fileId ? buildDriveViewUrl(item.fileId) : (item.externalUrl || '#')} target="_blank" rel="noreferrer">
                    <ExternalLink className="w-4 h-4 mr-1" /> {openLabel}
                  </a>
                </Button>
                <Button size="sm" asChild disabled={!item.fileId}>
                  <a href={item.fileId ? buildDriveDownloadUrl(item.fileId) : '#'} target="_blank" rel="noreferrer">
                    <Download className="w-4 h-4 mr-1" /> {downloadLabel}
                  </a>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

// ── Main section ─────────────────────────────────────────────────────────────
export default function ResourcesSection() {
  const { lang } = useLang();
  const s = STRINGS[(lang as Lang) in STRINGS ? (lang as Lang) : 'en'];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="career" className="space-y-6">
        <TabsList className="bg-white shadow-sm">
          <TabsTrigger value="career">{s.tabCareer}</TabsTrigger>
          <TabsTrigger value="details">{s.tabDetails}</TabsTrigger>
          <TabsTrigger value="course">{s.tabCourse}</TabsTrigger>
        </TabsList>
        <TabsContent value="career" className="space-y-4">
          <ResourceList
            title={s.titleCareer}
            description={s.descCareer}
            items={CAREER_PLANNER}
            lang={lang}
            openLabel={s.open}
            downloadLabel={s.download}
            notConfiguredMsg={s.notConfigured}
          />
        </TabsContent>
        <TabsContent value="details" className="space-y-4">
          <ResourceList
            title={s.titleDetails}
            description={s.descDetails}
            items={CAREER_DETAILS}
            lang={lang}
            openLabel={s.open}
            downloadLabel={s.download}
            notConfiguredMsg={s.notConfigured}
          />
        </TabsContent>
        <TabsContent value="course" className="space-y-4">
          <ResourceList
            title={s.titleCourse}
            description={s.descCourse}
            items={COURSE_GUIDANCE_CHART}
            lang={lang}
            openLabel={s.open}
            downloadLabel={s.download}
            notConfiguredMsg={s.notConfigured}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
