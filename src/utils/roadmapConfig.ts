export type MilestoneKey =
  | 'beginning_9th' | 'midterm_9th' | 'end_9th' | 'beginning_10th'
  | 'midterm_10th' | 'post_exam_10th' | 'before_results_10th' | 'final_decision';

export interface MilestoneConfig {
  key: MilestoneKey;
  labelEn: string;
  labelKn: string;
  labelTa: string;
  labelHi: string;
  editable: boolean;
}

export const MILESTONES: MilestoneConfig[] = [
  { key: 'beginning_9th', labelEn: 'Beginning of 9th Standard', labelKn: '9ನೇ ತರಗತಿಯ ಆರಂಭ', labelTa: '9ஆம் வகுப்பின் ஆரம்பம்', labelHi: '9वीं कक्षा की शुरुआत', editable: true },
  { key: 'midterm_9th', labelEn: 'Midterm of 9th Standard', labelKn: '9ನೇ ತರಗತಿಯ ಮಧ್ಯಾವಧಿ', labelTa: '9ஆம் வகுப்பின் இடைப்பருவம்', labelHi: '9वीं कक्षा का मध्यावधि', editable: true },
  { key: 'end_9th', labelEn: 'End of 9th Standard', labelKn: '9ನೇ ತರಗತಿಯ ಅಂತ್ಯ', labelTa: '9ஆம் வகுப்பின் முடிவு', labelHi: '9वीं कक्षा का अंत', editable: true },
  { key: 'beginning_10th', labelEn: 'Beginning of 10th Standard', labelKn: '10ನೇ ತರಗತಿಯ ಆರಂಭ', labelTa: '10ஆம் வகுப்பின் ஆரம்பம்', labelHi: '10वीं कक्षा की शुरुआत', editable: false },
  { key: 'midterm_10th', labelEn: 'Mid-term of 10th Standard', labelKn: '10ನೇ ತರಗತಿಯ ಮಧ್ಯಾವಧಿ', labelTa: '10ஆம் வகுப்பின் இடைப்பருவம்', labelHi: '10वीं कक्षा का मध्यावधि', editable: false },
  { key: 'post_exam_10th', labelEn: 'Post exams of 10th Standard', labelKn: '10ನೇ ತರಗತಿ ಪರೀಕ್ಷೆಗಳ ನಂತರ', labelTa: '10ஆம் வகுப்பு தேர்வுக்குப் பிறகு', labelHi: '10वीं कक्षा की परीक्षा के बाद', editable: false },
  { key: 'before_results_10th', labelEn: 'Before results of 10th Standard', labelKn: '10ನೇ ತರಗತಿ ಫಲಿತಾಂಶಗಳ ಮೊದಲು', labelTa: '10ஆம் வகுப்பு தேர்வு முடிவுகளுக்கு முன்', labelHi: '10वीं कक्षा के परिणाम से पहले', editable: false },
  { key: 'final_decision', labelEn: 'Finally decided Career choices', labelKn: 'ಅಂತಿಮವಾಗಿ ನಿರ್ಧರಿಸಿದ ವೃತ್ತಿ ಆಯ್ಕೆಗಳು', labelTa: 'இறுதியாக முடிவு செய்த தொழில் தேர்வுகள்', labelHi: 'अंतिम रूप से तय किए गए करियर विकल्प', editable: false },
];

export const COLUMN_LABELS: Record<string, { milestone: string; planA: string; planB: string; planC: string }> = {
  en: { milestone: 'Milestone', planA: 'Plan A', planB: 'Plan B', planC: 'Plan C' },
  kn: { milestone: 'ಮೈಲಿಗಲ್ಲು', planA: 'ಯೋಜನೆ A', planB: 'ಯೋಜನೆ B', planC: 'ಯೋಜನೆ C' },
  ta: { milestone: 'நிலை', planA: 'திட்டம் A', planB: 'திட்டம் B', planC: 'திட்டம் C' },
  hi: { milestone: 'पड़ाव', planA: 'योजना A', planB: 'योजना B', planC: 'योजना C' },
};

export type RoadmapRow = { plan_a: string; plan_b: string; plan_c: string };

export const getMilestoneLabel = (m: MilestoneConfig, lang: string): string => {
  if (lang === 'kn') return m.labelKn;
  if (lang === 'ta') return m.labelTa;
  if (lang === 'hi') return m.labelHi;
  return m.labelEn;
};
