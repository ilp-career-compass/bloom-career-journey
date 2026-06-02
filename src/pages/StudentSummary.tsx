import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLang } from '@/hooks/useLang';
import { useAuth } from '@/hooks/useAuth';
import {
  parseDreamEntries,
  parseHobbiesEntries,
  parseTalentsEntries,
  parseSchoolLearningEntries
} from '@/utils/summaryParsers';
import {
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Award,
  Compass,
  Printer,
  ArrowLeft,
  Calendar,
  User,
  Sparkles,
  Heart,
  Smile,
  Star
} from 'lucide-react';

type AssessmentType =
  | 'inspiration'
  | 'about_me'
  | 'dreams'
  | 'school_learning'
  | 'hobbies'
  | 'role_models'
  | 'personality'
  | 'career_guidance_tools';

type AssessmentRecord = {
  id: string;
  assessment_type: AssessmentType;
  assessment_title: string;
  completed_at: string;
  responses: any;
  review_status?: string;
};

const LOCAL_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    studentSummaryReport: "Student Summary Report",
    printableReportDesc: "Printable report for records and review",
    close: "Close",
    print: "Print",
    classLabel: "Class",
    mobileLabel: "Mobile",
    assessmentCompletion: "Assessment Completion Status",
    latestStatusJourney: "Latest status across the career guidance journey",
    completed: "Completed",
    notYet: "Not Started",
    overallAssessmentInsights: "Overall Career Insights",
    careerDirectionTitle: "AI Career Direction Synthesis",
    hollandCodeTitle: "Holland Code (RIASEC) Profile",
    keyStrengthsInterests: "Key Strengths & Areas of Interest",
    strengthsTitle: "Strengths",
    interestsTitle: "Interests",
    growthTitle: "Areas for Growth",
    careerRecommendationsTitle: "Career Recommendations & Planning",
    goalsTitle: "Career Goals",
    reviewStatusTitle: "Teacher Review Status",
    approved: "Approved",
    pending: "Pending Review",
    revisionRequested: "Revision Requested",
    rejected: "Revision Needed",
    bioLabel: "Aspiration Summary",
    
    // Modules
    inspiration: "My Inspiration",
    about_me: "About Me",
    dreams: "My Dreams",
    school_learning: "My School & Learning",
    hobbies: "My Hobbies & Talents",
    role_models: "My Role Models",
    
    // Details
    loadingText: "Preparing student summary...",
    noDataText: "This assessment has not been started yet.",
    approvedBadge: "Approved by Teacher",
    pendingBadge: "Pending Teacher Review",
    revisionBadge: "Revision Requested",
    rejectedBadge: "Revision Needed",
    
    // Dreams portfolio fields
    dreamCareer: "Dream Career",
    qualitiesNeeded: "Qualities & Strengths",
    preventingFailure: "Overcoming Obstacles",
    studyPath: "Action Plan & Study Path",
    
    // Hobbies & Talents fields
    hobbyLabel: "Hobby",
    talentLabel: "Talent",
    wantCareer: "Want a Career in This?",
    compatibleCareers: "Compatible Careers",
    matchingCareers: "Matching Careers",
    peopleExamples: "Real-life Role Models",
    yes: "Yes",
    no: "No",
    maybe: "Maybe",
    
    // School Learning fields
    likedSubjects: "Subjects I Like",
    likedCareers: "Careers Related to Liked Subjects",
    dislikedSubjects: "Subjects I Find Challenging",
    dislikedCareers: "Careers to Avoid",
    otherActivities: "Co-curricular / Extra Activities",
    skillsImprovement: "Skills I Want to Develop",
    
    // About Me questions mapped nicely
    friends: "Support System & Friends",
    dailyActivities: "Daily Routine Activities",
    schoolEnjoyed: "Favorite School Activities",
    outsideEnjoyed: "Favorite After-School Activities",
    personalEnjoyed: "Activities I Enjoy Alone",
    teamEnjoyed: "Activities I Enjoy in a Team",
    difficultSchool: "Challenging School Activities",
    difficultOutside: "Challenging Outside Activities",
    mandatoryActivities: "Responsibilities I Must Handle",
    easyActivities: "Tasks That Come Naturally to Me",
    hardActivities: "Tasks I Find Difficult to Learn",
    lovedQualities: "What I Value Most in Myself",
    othersLiked: "What My Peers Value in Me",
    qualitiesToImprove: "Qualities I'm Actively Improving",
    
    // Inspiration questions
    keyInspirations: "Key Inspirations & Role Models",
    avoidBehaviors: "Behaviors I Aim to Avoid",
    realLifeParallels: "Real-Life Parallels & Peer Influence",
    
    // Role models questions
    questionsToAsk: "Questions to Ask My Role Models",
    
    // Printing notes
    confidentialNote: "Confidential - For Educational Use Only"
  },
  kn: {
    studentSummaryReport: "ವಿದ್ಯಾರ್ಥಿ ಸಾರಾಂಶ ವರದಿ",
    printableReportDesc: "ದಾಖಲೆಗಳು ಮತ್ತು ಪರಿಶೀಲನೆಗಾಗಿ ಮುದ್ರಿಸಬಹುದಾದ ವರದಿ",
    close: "ಮುಚ್ಚಿ",
    print: "ಮುದ್ರಿಸು",
    classLabel: "ತರಗತಿ",
    mobileLabel: "ಮೊಬೈಲ್",
    assessmentCompletion: "ಮೌಲ್ಯಮಾಪನ ಪೂರ್ಣಗೊಂಡ ಸ್ಥಿತಿ",
    latestStatusJourney: "ವೃತ್ತಿ ಮಾರ್ಗದರ್ಶನ ಪ್ರಯಾಣದ ಇತ್ತೀಚಿನ ಸ್ಥಿತಿ",
    completed: "ಪೂರ್ಣಗೊಂಡಿದೆ",
    notYet: "ಪ್ರಾರಂಭಿಸಿಲ್ಲ",
    overallAssessmentInsights: "ಒಟ್ಟಾರೆ ವೃತ್ತಿ ಒಳನೋಟಗಳು",
    careerDirectionTitle: "AI ವೃತ್ತಿ ನಿರ್ದೇಶನ ಸಂಶ್ಲೇಷಣೆ",
    hollandCodeTitle: "ಹಾಲೆಂಡ್ ಕೋಡ್ (RIASEC) ವಿವರ",
    keyStrengthsInterests: "ಪ್ರಮುಖ ಸಾಮರ್ಥ್ಯಗಳು ಮತ್ತು ಆಸಕ್ತಿಯ ಕ್ಷೇತ್ರಗಳು",
    strengthsTitle: "ಸಾಮರ್ಥ್ಯಗಳು",
    interestsTitle: "ಆಸಕ್ತಿಗಳು",
    growthTitle: "ಬೆಳವಣಿಗೆಯ ಕ್ಷೇತ್ರಗಳು",
    careerRecommendationsTitle: "ವೃತ್ತಿ ಶಿಫಾರಸುಗಳು ಮತ್ತು ಯೋಜನೆ",
    goalsTitle: "ವೃತ್ತಿ ಗುರಿಗಳು",
    reviewStatusTitle: "ಶಿಕ್ಷಕರ ಮರುಪರಿಶೀಲನೆ ಸ್ಥಿತಿ",
    approved: "ಅನುಮೋದಿಸಲಾಗಿದೆ",
    pending: "ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ",
    revisionRequested: "ಪರಿಷ್ಕರಣೆ ವಿನಂತಿಸಲಾಗಿದೆ",
    rejected: "ಬದಲಾವಣೆ ಅಗತ್ಯವಿದೆ",
    bioLabel: "ಆಕಾಂಕ್ಷೆಯ ಸಾರಾಂಶ",
    
    inspiration: "ನನ್ನ ಪ್ರೇರಣೆ",
    about_me: "ನನ್ನ ಬಗ್ಗೆ",
    dreams: "ನನ್ನ ಕನಸುಗಳು",
    school_learning: "ನನ್ನ ಶಾಲೆ ಮತ್ತು ಕಲಿಕೆ",
    hobbies: "ನನ್ನ ಹವ್ಯಾಸಗಳು ಮತ್ತು ಪ್ರತಿಭೆಗಳು",
    role_models: "ನನ್ನ ಆದರ್ಶಗಳು",
    
    loadingText: "ವಿದ್ಯಾರ್ಥಿ ಸಾರಾಂಶವನ್ನು ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ...",
    noDataText: "ಈ ಮೌಲ್ಯಮಾಪನವನ್ನು ಇನ್ನೂ ಪ್ರಾರಂಭಿಸಿಲ್ಲ.",
    approvedBadge: "ಶಿಕ್ಷಕರಿಂದ ಅನುಮೋದಿಸಲಾಗಿದೆ",
    pendingBadge: "ಶಿಕ್ಷಕರ ಪರಿಶೀಲನೆ ಬಾಕಿ ಇದೆ",
    revisionBadge: "ಪರಿಷ್ಕರಣೆ ವಿನಂತಿಸಲಾಗಿದೆ",
    rejectedBadge: "ಬದಲಾವಣೆ ಅಗತ್ಯವಿದೆ",
    
    dreamCareer: "ಕನಸಿನ ವೃತ್ತಿ",
    qualitiesNeeded: "ಗುಣಗಳು ಮತ್ತು ಸಾಮರ್ಥ್ಯಗಳು",
    preventingFailure: "ಅಡೆತಡೆಗಳನ್ನು ನಿವಾರಿಸುವುದು",
    studyPath: "ಕಾರ್ಯ ಯೋಜನೆ ಮತ್ತು ಅಧ್ಯಯನ ಮಾರ್ಗ",
    
    hobbyLabel: "ಹವ್ಯಾಸ",
    talentLabel: "ಪ್ರತಿಭೆ",
    wantCareer: "ಇದರಲ್ಲಿ ವೃತ್ತಿ ಮಾಡಬೇಕೇ?",
    compatibleCareers: "ಹೊಂದಾಣಿಕೆಯಾಗುವ ವೃತ್ತಿಗಳು",
    matchingCareers: "ಹೊಂದುವ ವೃತ್ತಿಗಳು",
    peopleExamples: "ನಿಜ ಜೀವನದ ಆದರ್ಶಗಳು",
    yes: "ಹೌದು",
    no: "ಇಲ್ಲ",
    maybe: "ಬಹುಶಃ",
    
    likedSubjects: "ನನಗೆ ಇಷ್ಟವಾದ ವಿಷಯಗಳು",
    likedCareers: "ಇಷ್ಟವಾದ ವಿಷಯಗಳಿಗೆ ಸಂಬಂಧಿಸಿದ ವೃತ್ತಿಗಳು",
    dislikedSubjects: "ನನಗೆ ಸವಾಲಾಗುವ ವಿಷಯಗಳು",
    dislikedCareers: "ತಪ್ಪಿಸಬೇಕಾದ ವೃತ್ತಿಗಳು",
    otherActivities: "ಪಠ್ಯೇತರ ಚಟುವಟಿಕೆಗಳು",
    skillsImprovement: "ನಾನು ಬೆಳೆಸಿಕೊಳ್ಳಲು ಬಯಸುವ ಕೌಶಲ್ಯಗಳು",
    
    friends: "ಬೆಂಬಲ ವ್ಯವಸ್ಥೆ ಮತ್ತು ಸ್ನೇಹಿತರು",
    dailyActivities: "ದಿನಚರಿಯ ಚಟುವಟಿಕೆಗಳು",
    schoolEnjoyed: "ನೆಚ್ಚಿನ ಶಾಲಾ ಚಟುವಟಿಕೆಗಳು",
    outsideEnjoyed: "ಶಾಲೆಯ ನಂತರದ ನೆಚ್ಚಿನ ಚಟುವಟಿಕೆಗಳು",
    personalEnjoyed: "ವೈಯಕ್ತಿಕವಾಗಿ ಆನಂದಿಸುವ ಚಟುವಟಿಕೆಗಳು",
    teamEnjoyed: "ತಂಡವಾಗಿ ಆನಂದಿಸುವ ಚಟುವಟಿಕೆಗಳು",
    difficultSchool: "ಸವಾಲಿನ ಶಾಲಾ ಚಟುವಟಿಕೆಗಳು",
    difficultOutside: "ಶಾಲೆಯ ಹೊರಗಿನ ಸವಾಲಿನ ಚಟುವಟಿಕೆಗಳು",
    mandatoryActivities: "ನಾನು ನಿರ್ವಹಿಸಬೇಕಾದ ಜವಾಬ್ದಾರಿಗಳು",
    easyActivities: "ನನಗೆ ಸಹಜವಾಗಿ ಬರುವ ಕೆಲಸಗಳು",
    hardActivities: "ಕಲಿಯಲು ಕಷ್ಟವಾಗುವ ಕೆಲಸಗಳು",
    lovedQualities: "ನನ್ನಲ್ಲಿ ನಾನು ಹೆಚ್ಚು ಗೌರವಿಸುವ ಗುಣಗಳು",
    othersLiked: "ಇತರರು ನನ್ನಲ್ಲಿ ಇಷ್ಟಪಡುವ ಗುಣಗಳು",
    qualitiesToImprove: "ನಾನು ಸುಧಾರಿಸುತ್ತಿರುವ ಗುಣಗಳು",
    
    keyInspirations: "ಪ್ರಮುಖ ಪ್ರೇರಣೆಗಳು ಮತ್ತು ಆದರ್ಶಗಳು",
    avoidBehaviors: "ನಾನು ದೂರವಿಡಲು ಬಯಸುವ ನಡವಳಿಕೆಗಳು",
    realLifeParallels: "ನಿಜ ಜೀವನದ ಹೋಲಿಕೆಗಳು ಮತ್ತು ಗೆಳೆಯರ ಪ್ರಭಾವ",
    
    questionsToAsk: "ನನ್ನ ಆದರ್ಶಗಳಿಗೆ ಕೇಳಬೇಕಾದ ಪ್ರಶ್ನೆಗಳು",
    confidentialNote: "ಗೌಪ್ಯ - ಶೈಕ್ಷಣಿಕ ಬಳಕೆಗೆ ಮಾತ್ರ"
  },
  ta: {
    studentSummaryReport: "மாணவர் சுருக்க அறிக்கை",
    printableReportDesc: "பதிவுகள் மற்றும் மதிப்பாய்விற்கான அச்சிடக்கூடிய அறிக்கை",
    close: "மூடு",
    print: "அச்சிடு",
    classLabel: "வகுப்பு",
    mobileLabel: "கைபேசி",
    assessmentCompletion: "மதிப்பீடு நிறைவு நிலை",
    latestStatusJourney: "தொழில் வழிகாட்டுதல் பயணத்தின் சமீபத்திய நிலை",
    completed: "முடிந்தது",
    notYet: "தொடங்கப்படவில்லை",
    overallAssessmentInsights: "ஒட்டுமொத்த தொழில் நுண்ணறிவு",
    careerDirectionTitle: "AI தொழில் திசை ஒருங்கிணைப்பு",
    hollandCodeTitle: "ஹாலண்ட் குறியீடு (RIASEC) சுயவிவரம்",
    keyStrengthsInterests: "முக்கிய பலங்கள் & ஆர்வமுள்ள பகுதிகள்",
    strengthsTitle: "பலங்கள்",
    interestsTitle: "ஆர்வங்கள்",
    growthTitle: "மேம்படுத்த வேண்டிய பகுதிகள்",
    careerRecommendationsTitle: "தொழில் பரிந்துரைகள் & திட்டமிடல்",
    goalsTitle: "தொழில் இலக்குகள்",
    reviewStatusTitle: "ஆசிரியர் மதிப்பாய்வு நிலை",
    approved: "அங்கீகரிக்கப்பட்டது",
    pending: "மதிப்பாய்வில் உள்ளது",
    revisionRequested: "திருத்தம் கோரப்பட்டுள்ளது",
    rejected: "மாற்றம் தேவை",
    bioLabel: "விருப்பச் சுருக்கம்",
    
    inspiration: "என் உத்வேகம்",
    about_me: "என்னை பற்றி",
    dreams: "என் கனவுகள்",
    school_learning: "என் பள்ளி & கற்றல்",
    hobbies: "என் பொழுதுபோக்குகள் & திறமைகள்",
    role_models: "என் முன்மாதிரிகள்",
    
    loadingText: "மாணவர் சுருக்கம் தயாரிக்கப்படுகிறது...",
    noDataText: "இந்த மதிப்பீடு இன்னும் தொடங்கப்படவில்லை.",
    approvedBadge: "ஆசிரியரால் அங்கீகரிக்கப்பட்டது",
    pendingBadge: "ஆசிரியரின் மதிப்பாய்வுக்காக காத்திருக்கிறது",
    revisionBadge: "திருத்தம் கோரப்பட்டுள்ளது",
    rejectedBadge: "மாற்றம் தேவை",
    
    dreamCareer: "கனவுத் தொழில்",
    qualitiesNeeded: "பண்புகள் மற்றும் பலங்கள்",
    preventingFailure: "தடைகளைத் தாண்டுதல்",
    studyPath: "செயல் திட்டம் & படிப்பு பாதை",
    
    hobbyLabel: "பொழுதுபோக்கு",
    talentLabel: "திறமை",
    wantCareer: "இதில் தொழில் செய்ய வேண்டுமா?",
    compatibleCareers: "பொருத்தமான தொழில்கள்",
    matchingCareers: "பொருந்தும் தொழில்கள்",
    peopleExamples: "நிஜ வாழ்க்கை முன்மாதிரிகள்",
    yes: "ஆம்",
    no: "இல்லை",
    maybe: "ஒருவேளை",
    
    likedSubjects: "எனக்கு பிடித்த பாடங்கள்",
    likedCareers: "பிடித்த பாடங்கள் தொடர்பான தொழில்கள்",
    dislikedSubjects: "எனக்கு சவாலான பாடங்கள்",
    dislikedCareers: "தவிர்க்க வேண்டிய தொழில்கள்",
    otherActivities: "கூடுதல் செயல்பாடுகள்",
    skillsImprovement: "நான் வளர்க்க விரும்பும் திறன்கள்",
    
    friends: "ஆதரவு அமைப்பு மற்றும் நண்பர்கள்",
    dailyActivities: "தினசரி செயல்பாடுகள்",
    schoolEnjoyed: "பிடித்த பள்ளி செயல்பாடுகள்",
    outsideEnjoyed: "பள்ளிக்கு வெளியே பிடித்த செயல்பாடுகள்",
    personalEnjoyed: "தனிப்பட்ட முறையில் விரும்பும் செயல்பாடுகள்",
    teamEnjoyed: "குழுவாக விரும்பும் செயல்பாடுகள்",
    difficultSchool: "சவாலான பள்ளி செயல்பாடுகள்",
    difficultOutside: "பள்ளிக்கு வெளியே சவாலான செயல்பாடுகள்",
    mandatoryActivities: "நான் செய்ய வேண்டிய பொறுப்புகள்",
    easyActivities: "எனக்கு எளிதாக வரும் செயல்கள்",
    hardActivities: "கற்றுக்கொள்ள கடினமாக இருக்கும் செயல்கள்",
    lovedQualities: "என்னிடத்தில் நான் அதிகம் மதிக்கும் குணங்கள்",
    othersLiked: "மற்றவர்கள் என்னிடத்தில் விரும்பும் குணங்கள்",
    qualitiesToImprove: "நான் மேம்படுத்த விரும்பும் குணங்கள்",
    
    keyInspirations: "முக்கிய உத்வேகங்கள் & முன்மாதிரிகள்",
    avoidBehaviors: "நான் தவிர்க்க விரும்பும் நடத்தைகள்",
    realLifeParallels: "நிஜ வாழ்க்கை ஒப்பீடுகள் & நண்பர்களின் செல்வாக்கு",
    
    questionsToAsk: "என் முன்மாதிரிகளிடம் கேட்க வேண்டிய கேள்விகள்",
    confidentialNote: "ரகசியமானது - கல்விப் பயன்பாட்டிற்கு மட்டும்"
  },
  hi: {
    studentSummaryReport: "छात्र सारांश रिपोर्ट",
    printableReportDesc: "रिकॉर्ड और समीक्षा के लिए मुद्रण योग्य रिपोर्ट",
    close: "बंद करें",
    print: "प्रिंट",
    classLabel: "कक्षा",
    mobileLabel: "मोबाइल",
    assessmentCompletion: "असेसमेंट पूर्णता स्थिति",
    latestStatusJourney: "करियर मार्गदर्शन यात्रा की नवीनतम स्थिति",
    completed: "पूरा हुआ",
    notYet: "शुरू नहीं हुआ",
    overallAssessmentInsights: "समग्र करियर अंतर्दृष्टि",
    careerDirectionTitle: "AI करियर दिशा संश्लेषण",
    hollandCodeTitle: "हॉलैंड कोड (RIASEC) प्रोफाइल",
    keyStrengthsInterests: "प्रमुख ताकतें और रुचि के क्षेत्र",
    strengthsTitle: "ताकत",
    interestsTitle: "रुचियां",
    growthTitle: "सुधार के क्षेत्र",
    careerRecommendationsTitle: "करियर सिफारिशें और योजना",
    goalsTitle: "करियर लक्ष्य",
    reviewStatusTitle: "शिक्षक समीक्षा स्थिति",
    approved: "स्वीकृत",
    pending: "समीक्षा लंबित",
    revisionRequested: "संशोधन का अनुरोध किया",
    rejected: "संशोधन की आवश्यकता",
    bioLabel: "आकांक्षा सारांश",
    
    inspiration: "मेरी प्रेरणा",
    about_me: "मेरे बारे में",
    dreams: "मेरे सपने",
    school_learning: "मेरा स्कूल और शिक्षा",
    hobbies: "मेरे शौक और प्रतिभा",
    role_models: "मेरे रोल मॉडल",
    
    loadingText: "छात्र सारांश तैयार किया जा रहा है...",
    noDataText: "यह मूल्यांकन अभी शुरू नहीं किया गया है।",
    approvedBadge: "शिक्षक द्वारा स्वीकृत",
    pendingBadge: "शिक्षक समीक्षा लंबित",
    revisionBadge: "संशोधन का अनुरोध किया गया",
    rejectedBadge: "संशोधन आवश्यक",
    
    dreamCareer: "सपनों का करियर",
    qualitiesNeeded: "गुण और ताकत",
    preventingFailure: "बाधाओं को पार करना",
    studyPath: "कार्य योजना और अध्ययन मार्ग",
    
    hobbyLabel: "शौक",
    talentLabel: "प्रतिभा",
    wantCareer: "क्या इसमें करियर बनाना चाहते हैं?",
    compatibleCareers: "संगत करियर",
    matchingCareers: "अनुकूल करियर",
    peopleExamples: "वास्तविक जीवन के रोल मॉडल",
    yes: "हाँ",
    no: "नहीं",
    maybe: "शायद",
    
    likedSubjects: "पसंदीदा विषय",
    likedCareers: "पसंदीदा विषयों से संबंधित करियर",
    dislikedSubjects: "चुनौतीपूर्ण विषय",
    dislikedCareers: "बचने योग्य करियर",
    otherActivities: "पाठ्येतर गतिविधियाँ",
    skillsImprovement: "कौशल जिन्हें मैं विकसित करना चाहता हूँ",
    
    friends: "सहायता प्रणाली और मित्र",
    dailyActivities: "दैनिक गतिविधियां",
    schoolEnjoyed: "पसंदीदा स्कूल गतिविधियाँ",
    outsideEnjoyed: "स्कूल के बाद की पसंदीदा गतिविधियाँ",
    personalEnjoyed: "अकेले में पसंद की जाने वाली गतिविधियाँ",
    teamEnjoyed: "समूह में पसंद की जाने वाली गतिविधियाँ",
    difficultSchool: "चुनौतीपूर्ण स्कूल गतिविधियाँ",
    difficultOutside: "स्कूल से बाहर की चुनौतीपूर्ण गतिविधियाँ",
    mandatoryActivities: "जिम्मेदारियां जिन्हें मुझे संभालना है",
    easyActivities: "कार्य जो मैं आसानी से कर लेता हूँ",
    hardActivities: "सीखने में कठिन कार्य",
    lovedQualities: "गुण जिन्हें मैं अपने बारे में सबसे अधिक महत्व देता हूँ",
    othersLiked: "गुण जो दूसरे मुझमें पसंद करते हैं",
    qualitiesToImprove: "गुण जिनमें मैं सक्रिय रूप से सुधार कर रहा हूँ",
    
    keyInspirations: "प्रमुख प्रेरणाएँ और रोल मॉडल",
    avoidBehaviors: "व्यवहार जिनसे मैं बचना चाहता हूँ",
    realLifeParallels: "वास्तविक जीवन की समानताएं और सहकर्मी प्रभाव",
    
    questionsToAsk: "मेरे रोल मॉडल से पूछे जाने वाले प्रश्न",
    confidentialNote: "गोपनीय - केवल शैक्षिक उपयोग के लिए"
  }
};

export default function StudentSummary() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang } = useLang();
  const { userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState<string>('');
  const [studentMobile, setStudentMobile] = useState<string>('');
  const [className, setClassName] = useState<string>('');
  
  // Student user details
  const [bio, setBio] = useState<string>('');
  const [interests, setInterests] = useState<string>('');
  const [careerGoals, setCareerGoals] = useState<string>('');
  const [strengths, setStrengths] = useState<string>('');
  const [areasForGrowth, setAreasForGrowth] = useState<string>('');
  
  // Holland Code (from personality responses)
  const [hollandCode, setHollandCode] = useState<string>('');
  
  // Profile card cache / career direction
  const [careerDirection, setCareerDirection] = useState<string>('');

  // Assessment records and summaries
  const [records, setRecords] = useState<AssessmentRecord[]>([]);
  const [summaries, setSummaries] = useState<Record<string, any>>({});

  const t = (key: string): string => {
    return LOCAL_TRANSLATIONS[lang]?.[key] || LOCAL_TRANSLATIONS['en']?.[key] || key;
  };

  const latestByType = useMemo(() => {
    const map: Partial<Record<AssessmentType, AssessmentRecord>> = {};
    for (const r of records) {
      const t = r.assessment_type;
      if (!map[t] || new Date(r.completed_at) > new Date(map[t]!.completed_at)) {
        map[t] = r;
      }
    }
    return map;
  }, [records]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // Fetch student basics and user profile details
        const { data: student, error: sErr } = await supabase
          .from('students')
          .select('id, user_id, users:users(full_name, mobile, bio, interests, career_goals, strengths, areas_for_growth), classes:classes(name)')
          .eq('id', id)
          .single();

        let studentUserId = '';
        if (!sErr && student) {
          studentUserId = student.user_id;
          setStudentName((student as any).users?.full_name || 'Student');
          setStudentMobile((student as any).users?.mobile || '');
          setClassName((student as any).classes?.name || '');
          
          setBio((student as any).users?.bio || '');
          setInterests((student as any).users?.interests || '');
          setCareerGoals((student as any).users?.career_goals || '');
          setStrengths((student as any).users?.strengths || '');
          setAreasForGrowth((student as any).users?.areas_for_growth || '');
        }

        const { data: assessments } = await supabase
          .from('assessment_responses')
          .select('id, assessment_type, assessment_title, completed_at, responses, review_status')
          .eq('student_id', id)
          .order('completed_at', { ascending: false });

        const validAssessments = (assessments || []) as AssessmentRecord[];
        setRecords(validAssessments);

        // Fetch Holland Code
        const personalityRecord = validAssessments.find(a => a.assessment_type === 'personality');
        if (personalityRecord) {
          setHollandCode(personalityRecord.responses?.holland_code || '');
        }

        if (studentUserId) {
          // Fetch career direction from profile card cache
          const { data: cachedRows } = await supabase
            .from('profile_card_cache')
            .select('assessment_type, keywords, approval_status')
            .eq('student_id', studentUserId);

          if (cachedRows) {
            const dirRow = cachedRows.find(r => r.assessment_type === 'career_direction');
            if (dirRow && dirRow.keywords?.direction) {
              setCareerDirection(dirRow.keywords.direction);
            }
          }

          // Fetch summaries
          const responseIds = validAssessments.map(r => r.id);
          if (responseIds.length > 0) {
            const { data: summaryRows } = await supabase
              .from('assessment_summaries')
              .select('*')
              .in('assessment_response_id', responseIds);

            if (summaryRows) {
              const summaryMap: Record<string, any> = {};
              summaryRows.forEach(row => {
                summaryMap[row.assessment_response_id] = row;
              });
              setSummaries(summaryMap);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching student summary report:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const printPage = () => window.print();

  const mapReviewStatus = (status: string) => {
    switch (status) {
      case 'reviewed':
        return 'approved';
      case 'needs_revision':
        return 'revisionRequested';
      case 'flagged':
        return 'rejected';
      case 'unreviewed':
      case 'in_review':
      default:
        return 'pending';
    }
  };

  // Helper to extract active summary object
  const getDisplaySummaryData = (rec: AssessmentRecord) => {
    const summaryObj = summaries[rec.id];
    if (summaryObj) {
      const data = summaryObj.student_edited_summary || summaryObj.teacher_edited_summary || summaryObj.ai_summary;
      if (data && Object.keys(data).length > 0) return data;
    }

    // Fallback: Construct summaryData from raw responses directly if summaryObj is missing!
    const responses = rec.responses;
    if (!responses) return null;

    if (rec.assessment_type === 'inspiration') {
      const videoKeys = Object.keys(responses).filter(key => key.startsWith('video')).sort();
      if (videoKeys.length > 0) {
        let question1 = '';
        let question2 = '';
        let question3 = '';
        videoKeys.forEach(vKey => {
          const vData = responses[vKey] || {};
          if (vData.question1) question1 += (question1 ? '\n' : '') + vData.question1;
          if (vData.question2) question1 += (question1 ? '\n' : '') + vData.question2;
          if (vData.question3) question1 += (question1 ? '\n' : '') + vData.question3;
          if (vData.question4) question2 += (question2 ? '\n' : '') + vData.question4;
          if (vData.question5) question2 += (question2 ? '\n' : '') + vData.question5;
          if (vData.question6) question3 += (question3 ? '\n' : '') + vData.question6;
          if (vData.question7) question3 += (question3 ? '\n' : '') + vData.question7;
          if (vData.question8) question3 += (question3 ? '\n' : '') + vData.question8;
        });
        return { question1, question2, question3 };
      }
    }

    if (rec.assessment_type === 'about_me') {
      return responses;
    }

    if (rec.assessment_type === 'dreams') {
      const partKeys = Object.keys(responses).filter(key => key.startsWith('part')).sort();
      const entries = partKeys.map(partKey => {
        const pResponses = responses[partKey] || {};
        return {
          dream: pResponses.question1 || pResponses.question2 || '',
          quality_value_strength: pResponses.question3 || '',
          prevent_failure: pResponses.question4 || '',
          study_path: pResponses.question5 || ''
        };
      }).filter(e => e.dream);
      return {
        question1: JSON.stringify(entries)
      };
    }

    if (rec.assessment_type === 'school_learning') {
      const p1 = responses.part1 || {};
      const p2 = responses.part2 || {};
      const p3 = responses.part3 || {};
      const entry = {
        liked_subjects: p1.question1 || '',
        liked_careers: p1.question2 || '',
        disliked_subjects: p2.question1 || '',
        disliked_careers: p2.question2 || '',
        other_activities: p3.question1 || '',
        skills_improvement: p3.question2 || ''
      };
      return {
        question1: JSON.stringify([entry])
      };
    }

    if (rec.assessment_type === 'hobbies') {
      const p1 = responses.part1 || {};
      const p2 = responses.part2 || {};
      
      const hobbyEntries: any[] = [];
      const talentEntries: any[] = [];
      
      Object.keys(p1).forEach(hKey => {
        const h = p1[hKey] || {};
        if (h.question1) {
          hobbyEntries.push({
            hobby: h.question1,
            want_career: h.question2 || '',
            compatible_careers: h.question3 || '',
            people_examples: h.question4 || ''
          });
        }
      });
      
      Object.keys(p2).forEach(tKey => {
        const tVal = p2[tKey] || {};
        if (tVal.question1) {
          talentEntries.push({
            talent: tVal.question1,
            want_career: tVal.question2 || '',
            matching_careers: tVal.question3 || '',
            people_examples: tVal.question4 || ''
          });
        }
      });
      
      return {
        question1: JSON.stringify(hobbyEntries),
        question6: JSON.stringify(talentEntries)
      };
    }

    if (rec.assessment_type === 'role_models') {
      const p1 = responses.part1 || {};
      const questions: string[] = [];
      Object.keys(p1).forEach(k => {
        const item = p1[k] || {};
        if (item.question3) questions.push(item.question3);
      });
      return {
        question1: questions.join('\n')
      };
    }

    return null;
  };

  const getSummaryStatus = (rec: AssessmentRecord) => {
    return mapReviewStatus(rec.review_status || 'unreviewed');
  };

  // Parsers and renderers
  const renderDreamsPortfolio = (summaryData: any) => {
    const q1 = summaryData?.question1 || '';
    const entries = parseDreamEntries(q1);
    if (entries.length === 0) return <p className="text-sm text-gray-500 italic mt-2">{t('noDataText')}</p>;
    
    return (
      <div className="overflow-x-auto mt-3 border border-gray-150 rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">{t('dreamCareer')}</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">{t('qualitiesNeeded')}</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">{t('preventingFailure')}</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">{t('studyPath')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.map((entry, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-sm font-bold text-indigo-900 align-top">{entry.dream}</td>
                <td className="px-4 py-3 text-sm text-slate-600 align-top leading-relaxed">{entry.quality_value_strength}</td>
                <td className="px-4 py-3 text-sm text-slate-600 align-top leading-relaxed">{entry.prevent_failure}</td>
                <td className="px-4 py-3 text-sm text-slate-600 align-top leading-relaxed">{entry.study_path}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderHobbiesPortfolio = (summaryData: any) => {
    const q1 = summaryData?.question1 || '';
    const q6 = summaryData?.question6 || '';
    const hobbies = parseHobbiesEntries(q1);
    const talents = parseTalentsEntries(q6);
    
    if (hobbies.length === 0 && talents.length === 0) {
      return <p className="text-sm text-gray-500 italic mt-2">{t('noDataText')}</p>;
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        {hobbies.length > 0 && (
          <div className="border border-orange-100 rounded-xl p-4 bg-orange-50/15">
            <h4 className="text-sm font-bold text-orange-800 mb-3 capitalize flex items-center gap-1.5">
              <Smile className="w-4 h-4" /> {t('hobbies')}
            </h4>
            <div className="space-y-3">
              {hobbies.map((entry, idx) => (
                <div key={idx} className="bg-white p-3.5 rounded-lg border border-orange-100 shadow-sm">
                  <div className="flex justify-between items-start gap-2 flex-wrap">
                    <div className="font-bold text-sm text-orange-950">{entry.hobby}</div>
                    <Badge variant="outline" className="text-xs bg-orange-50/50 text-orange-700 border-orange-200">
                      {t('wantCareer')}: {entry.want_career?.toLowerCase() === 'yes' ? t('yes') : entry.want_career?.toLowerCase() === 'no' ? t('no') : entry.want_career || t('maybe')}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                    <span className="font-semibold text-slate-700">{t('compatibleCareers')}:</span> {entry.compatible_careers}
                  </div>
                  {entry.people_examples && (
                    <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                      <span className="font-semibold text-slate-700">{t('peopleExamples')}:</span> {entry.people_examples}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {talents.length > 0 && (
          <div className="border border-pink-100 rounded-xl p-4 bg-pink-50/15">
            <h4 className="text-sm font-bold text-pink-800 mb-3 capitalize flex items-center gap-1.5">
              <Star className="w-4 h-4" /> {t('talentLabel')}
            </h4>
            <div className="space-y-3">
              {talents.map((entry, idx) => (
                <div key={idx} className="bg-white p-3.5 rounded-lg border border-pink-100 shadow-sm">
                  <div className="flex justify-between items-start gap-2 flex-wrap">
                    <div className="font-bold text-sm text-pink-950">{entry.talent}</div>
                    <Badge variant="outline" className="text-xs bg-pink-50/50 text-pink-700 border-pink-200">
                      {t('wantCareer')}: {entry.want_career?.toLowerCase() === 'yes' ? t('yes') : entry.want_career?.toLowerCase() === 'no' ? t('no') : entry.want_career || t('maybe')}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                    <span className="font-semibold text-slate-700">{t('matchingCareers')}:</span> {entry.matching_careers}
                  </div>
                  {entry.people_examples && (
                    <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                      <span className="font-semibold text-slate-700">{t('peopleExamples')}:</span> {entry.people_examples}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSchoolLearning = (summaryData: any) => {
    const q1 = summaryData?.question1 || '';
    const entries = parseSchoolLearningEntries(q1);
    if (entries.length === 0) return <p className="text-sm text-gray-500 italic mt-2">{t('noDataText')}</p>;
    
    return (
      <div className="space-y-4 mt-3">
        {entries.map((entry, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-emerald-100 bg-emerald-50/10 p-4 rounded-xl">
              <h4 className="font-bold text-xs text-emerald-800 uppercase tracking-wider mb-2">{t('likedSubjects')}</h4>
              <div className="text-sm font-bold text-emerald-950">{entry.liked_subjects}</div>
              <div className="text-xs text-slate-600 mt-2 leading-relaxed">
                <span className="font-semibold text-slate-700">{t('likedCareers')}:</span> {entry.liked_careers}
              </div>
            </div>
            
            <div className="border border-rose-100 bg-rose-50/10 p-4 rounded-xl">
              <h4 className="font-bold text-xs text-rose-800 uppercase tracking-wider mb-2">{t('dislikedSubjects')}</h4>
              <div className="text-sm font-bold text-rose-950">{entry.disliked_subjects}</div>
              <div className="text-xs text-slate-600 mt-2 leading-relaxed">
                <span className="font-semibold text-slate-700">{t('dislikedCareers')}:</span> {entry.disliked_careers}
              </div>
            </div>
            
            <div className="border border-slate-150 bg-slate-50/50 p-4 rounded-xl md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-bold text-xs text-slate-600 uppercase tracking-wider mb-1">{t('otherActivities')}</h4>
                <div className="text-sm text-slate-800 leading-relaxed">{entry.other_activities || '—'}</div>
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-600 uppercase tracking-wider mb-1">{t('skillsImprovement')}</h4>
                <div className="text-sm text-slate-800 leading-relaxed">{entry.skills_improvement || '—'}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderAboutMe = (summaryData: any) => {
    if (!summaryData) return <p className="text-sm text-gray-500 italic mt-2">{t('noDataText')}</p>;
    
    const fields = [
      { key: 'question1', labelKey: 'friends' },
      { key: 'question2', labelKey: 'dailyActivities' },
      { key: 'question3', labelKey: 'schoolEnjoyed' },
      { key: 'question4', labelKey: 'outsideEnjoyed' },
      { key: 'question5', labelKey: 'personalEnjoyed' },
      { key: 'question6', labelKey: 'teamEnjoyed' },
      { key: 'question7', labelKey: 'difficultSchool' },
      { key: 'question8', labelKey: 'difficultOutside' },
      { key: 'question9', labelKey: 'mandatoryActivities' },
      { key: 'question10', labelKey: 'easyActivities' },
      { key: 'question11', labelKey: 'hardActivities' },
      { key: 'question12', labelKey: 'lovedQualities' },
      { key: 'question13', labelKey: 'othersLiked' },
      { key: 'question14', labelKey: 'qualitiesToImprove' }
    ];
    
    const activeFields = fields.filter(f => summaryData[f.key] && summaryData[f.key].trim());
    if (activeFields.length === 0) return <p className="text-sm text-gray-500 italic mt-2">{t('noDataText')}</p>;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        {activeFields.map(field => (
          <div key={field.key} className="p-3.5 border border-slate-100 rounded-xl bg-slate-50/30 hover:bg-slate-50 transition-colors">
            <div className="text-xs font-bold text-indigo-600 uppercase mb-1.5">{t(field.labelKey)}</div>
            <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{summaryData[field.key]}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderInspiration = (summaryData: any) => {
    if (!summaryData) return <p className="text-sm text-gray-500 italic mt-2">{t('noDataText')}</p>;
    
    const fields = [
      { key: 'question1', labelKey: 'keyInspirations', color: 'border-blue-100 bg-blue-50/5 text-blue-950' },
      { key: 'question2', labelKey: 'avoidBehaviors', color: 'border-amber-100 bg-amber-50/5 text-amber-950' },
      { key: 'question3', labelKey: 'realLifeParallels', color: 'border-purple-100 bg-purple-50/5 text-purple-950' }
    ];
    
    const activeFields = fields.filter(f => summaryData[f.key] && summaryData[f.key].trim());
    if (activeFields.length === 0) return <p className="text-sm text-gray-500 italic mt-2">{t('noDataText')}</p>;
    
    return (
      <div className="space-y-3.5 mt-3">
        {activeFields.map(field => (
          <div key={field.key} className={`p-4 border rounded-xl leading-relaxed ${field.color}`}>
            <div className="text-xs font-bold uppercase tracking-wider mb-1.5 opacity-80">{t(field.labelKey)}</div>
            <div className="text-sm whitespace-pre-wrap">{summaryData[field.key]}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderRoleModels = (summaryData: any) => {
    const q1 = summaryData?.question1 || '';
    if (!q1.trim()) return <p className="text-sm text-gray-500 italic mt-2">{t('noDataText')}</p>;
    
    const questionsList = q1.split('\n')
      .map(q => q.trim())
      .filter(q => q.length > 0)
      .map(q => q.replace(/^\d+[\.\-\s]*/, ''));
      
    if (questionsList.length === 0) return <p className="text-sm text-gray-500 italic mt-2">{t('noDataText')}</p>;
    
    return (
      <div className="mt-3 border border-purple-100 bg-purple-50/5 p-4.5 rounded-xl">
        <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-3">{t('questionsToAsk')}</h4>
        <ul className="space-y-3">
          {questionsList.map((q, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm text-slate-800">
              <Badge className="bg-purple-100 text-purple-800 border-none font-bold mt-0.5" variant="outline">
                {idx + 1}
              </Badge>
              <div className="leading-relaxed">{q}</div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderModuleSummary = (type: AssessmentType) => {
    const rec = latestByType[type];
    if (!rec) return <p className="text-sm text-slate-500 italic mt-2">{t('noDataText')}</p>;

    const summaryData = getDisplaySummaryData(rec);
    const status = getSummaryStatus(rec);

    return (
      <div className="mt-4 p-5 border border-slate-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow duration-300 break-inside-avoid print:shadow-none print:border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-2 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">{t(type)}</h3>
            <Badge className="print:border" variant={status === 'approved' ? 'default' : 'secondary'}>
              {t(status)}
            </Badge>
          </div>
          <span className="text-xs text-slate-400">{new Date(rec.completed_at).toLocaleDateString(lang)}</span>
        </div>
        
        {type === 'inspiration' && renderInspiration(summaryData)}
        {type === 'about_me' && renderAboutMe(summaryData)}
        {type === 'dreams' && renderDreamsPortfolio(summaryData)}
        {type === 'school_learning' && renderSchoolLearning(summaryData)}
        {type === 'hobbies' && renderHobbiesPortfolio(summaryData)}
        {type === 'role_models' && renderRoleModels(summaryData)}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-indigo-600 font-semibold animate-pulse flex items-center gap-2">
          <Sparkles className="w-5 h-5 animate-spin" /> {t('loadingText')}
        </div>
      </div>
    );
  }

  const overallCompletedCount = (['inspiration', 'about_me', 'dreams', 'school_learning', 'hobbies', 'role_models'] as AssessmentType[])
    .filter(t => !!latestByType[t]).length;

  return (
    <div className="min-h-screen bg-slate-50/50 print:bg-white text-slate-900 pb-12">
      {/* Print styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            font-size: 12pt;
          }
          .print\\:hidden {
            display: none !important;
          }
          .container {
            max-width: 100% !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          @page {
            margin: 15mm;
          }
        }
      `}</style>

      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b print:hidden shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3 max-w-6xl">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(userProfile?.role === 'admin' ? `/admin?lang=${lang}` : `/teacher?lang=${lang}`)} className="text-slate-600">
              <ArrowLeft className="w-4 h-4 mr-1" /> {t('close')}
            </Button>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-slate-800">{t('studentSummaryReport')}</h1>
              <p className="text-xs text-slate-400">{t('printableReportDesc')}</p>
            </div>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-colors" size="sm" onClick={printPage}>
            <Printer className="w-4 h-4 mr-1.5" /> {t('print')}
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6 print:py-0 print:px-0">
        {/* Top Header Card */}
        <Card className="border-0 shadow-md bg-white overflow-hidden relative print:shadow-none print:border print:border-slate-200">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 print:hidden" />
          <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 uppercase tracking-wider font-bold text-xs" variant="outline">
                  {t('studentSummaryReport')}
                </Badge>
                <span className="text-xs text-slate-400">• {t('confidentialNote')}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{studentName}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> <strong>{t('classLabel')}:</strong> {className || '—'}</span>
                {studentMobile && <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> <strong>{t('mobileLabel')}:</strong> {studentMobile}</span>}
              </div>
            </div>
            {bio && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 max-w-sm w-full md:w-auto print:bg-white print:border-slate-200">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('bioLabel')}</div>
                <div className="text-sm italic text-slate-800 leading-relaxed">"{bio}"</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completion Progress Overview */}
        <Card className="border-0 shadow-md bg-white print:shadow-none print:border print:border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-500" /> {t('assessmentCompletion')}
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">{t('latestStatusJourney')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 print:grid-cols-3">
              {(['inspiration', 'about_me', 'dreams', 'school_learning', 'hobbies', 'role_models'] as AssessmentType[]).map(tKey => {
                const rec = latestByType[tKey];
                return (
                  <div key={tKey} className="p-3 border rounded-xl bg-slate-50/50 flex flex-col justify-between hover:bg-slate-50 transition-colors print:bg-white print:border-slate-200">
                    <span className="font-semibold text-xs text-slate-700 capitalize line-clamp-1">{t(tKey)}</span>
                    <div className="mt-2.5 flex items-center justify-between">
                      <Badge className="text-[10px] py-0.5 font-bold print:border" variant={rec ? 'default' : 'secondary'}>
                        {rec ? t('completed') : t('notYet')}
                      </Badge>
                      {rec && <span className="text-[9px] text-slate-400">{new Date(rec.completed_at).toLocaleDateString(lang)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Overall Career Insights */}
        {(careerDirection || hollandCode) && (
          <Card className="border-0 shadow-md bg-white print:shadow-none print:border print:border-slate-200 break-inside-avoid">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-500" /> {t('overallAssessmentInsights')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {careerDirection && (
                <div className="p-5 border border-indigo-50 rounded-2xl bg-indigo-50/5 flex items-start gap-4">
                  <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl hidden sm:block">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-indigo-900 mb-1">{t('careerDirectionTitle')}</h3>
                    <p className="text-sm text-indigo-950 leading-relaxed italic">"{careerDirection}"</p>
                  </div>
                </div>
              )}

              {hollandCode && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border border-slate-100 rounded-2xl bg-slate-50/50 gap-4 print:bg-white print:border-slate-200">
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-slate-900">{t('hollandCodeTitle')}</h3>
                    <p className="text-xs text-slate-500">Psychometric personality interest alignment based on RIASEC theory.</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white py-2 px-4 rounded-xl border border-indigo-100 shadow-sm print:shadow-none">
                    <Award className="w-5 h-5 text-indigo-600" />
                    <span className="text-2xl font-black text-indigo-700 tracking-widest">{hollandCode}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Key Strengths & Interests from Profile */}
        {(strengths || interests || careerGoals || areasForGrowth) && (
          <Card className="border-0 shadow-md bg-white print:shadow-none print:border print:border-slate-200 break-inside-avoid">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Heart className="w-5 h-5 text-indigo-500" /> {t('keyStrengthsInterests')}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strengths && (
                <div className="p-4 border border-slate-100 bg-slate-50/30 rounded-xl print:bg-white print:border-slate-200">
                  <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1.5">{t('strengthsTitle')}</div>
                  <p className="text-sm text-slate-800 leading-relaxed">{strengths}</p>
                </div>
              )}
              {interests && (
                <div className="p-4 border border-slate-100 bg-slate-50/30 rounded-xl print:bg-white print:border-slate-200">
                  <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1.5">{t('interestsTitle')}</div>
                  <p className="text-sm text-slate-800 leading-relaxed">{interests}</p>
                </div>
              )}
              {careerGoals && (
                <div className="p-4 border border-slate-100 bg-slate-50/30 rounded-xl print:bg-white print:border-slate-200">
                  <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1.5">{t('goalsTitle')}</div>
                  <p className="text-sm text-slate-800 leading-relaxed">{careerGoals}</p>
                </div>
              )}
              {areasForGrowth && (
                <div className="p-4 border border-slate-100 bg-slate-50/30 rounded-xl print:bg-white print:border-slate-200">
                  <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1.5">{t('growthTitle')}</div>
                  <p className="text-sm text-slate-800 leading-relaxed">{areasForGrowth}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Detailed Assessment Syntheses */}
        <div className="space-y-4">
          {(['inspiration', 'about_me', 'dreams', 'school_learning', 'hobbies', 'role_models'] as AssessmentType[]).map(tKey => {
            return <React.Fragment key={tKey}>{renderModuleSummary(tKey)}</React.Fragment>;
          })}
        </div>
      </div>
    </div>
  );
}
