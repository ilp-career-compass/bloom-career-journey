import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Heart } from 'lucide-react';

const STRINGS: Record<string, {
  title: string;
  col_subject: string;
  col_lesson: string;
  col_why: string;
  col_career: string;
  empty: string;
  not_found: string;
}> = {
  en: {
    title: 'Things that Interest Me',
    col_subject: 'Subject',
    col_lesson: 'Lesson / Chapter',
    col_why: 'Why or What factors led you to like this lesson/chapter?',
    col_career: 'A compatible career',
    empty: 'This student has not added any interests yet.',
    not_found: 'Student record not found.',
  },
  kn: {
    title: 'ನನಗೆ ಆಸಕ್ತಿ ಇರುವ ವಿಷಯಗಳು',
    col_subject: 'ವಿಷಯ',
    col_lesson: 'ಪಾಠ / ಅಧ್ಯಾಯ',
    col_why: 'ಈ ಪಾಠ/ಅಧ್ಯಾಯವನ್ನು ಇಷ್ಟಪಡಲು ಯಾವ ಅಂಶಗಳು ಕಾರಣ?',
    col_career: 'ಹೊಂದಿಕೆಯಾಗುವ ವೃತ್ತಿ',
    empty: 'ಈ ವಿದ್ಯಾರ್ಥಿ ಇನ್ನೂ ಯಾವುದೇ ಆಸಕ್ತಿಗಳನ್ನು ಸೇರಿಸಿಲ್ಲ.',
    not_found: 'ವಿದ್ಯಾರ್ಥಿ ದಾಖಲೆ ಕಂಡುಬಂದಿಲ್ಲ.',
  },
  ta: {
    title: 'எனக்கு ஆர்வமான விஷயங்கள்',
    col_subject: 'பாடம்',
    col_lesson: 'பாடம் / அத்தியாயம்',
    col_why: 'இந்த பாடம்/அத்தியாயத்தை ஏன் விரும்புகிறீர்கள்?',
    col_career: 'பொருத்தமான தொழில்',
    empty: 'இந்த மாணவர் இன்னும் எந்த ஆர்வங்களையும் சேர்க்கவில்லை.',
    not_found: 'மாணவர் பதிவு கண்டுபிடிக்கப்படவில்லை.',
  },
  hi: {
    title: 'मुझे जिन चीज़ों में रुचि है',
    col_subject: 'विषय',
    col_lesson: 'पाठ / अध्याय',
    col_why: 'इस पाठ/अध्याय को पसंद करने के क्या कारण हैं?',
    col_career: 'एक उपयुक्त करियर',
    empty: 'इस छात्र ने अभी तक कोई रुचि नहीं जोड़ी है।',
    not_found: 'छात्र का रिकॉर्ड नहीं मिला।',
  },
};

interface InterestRow {
  subject: string;
  lesson_chapter: string;
  why_factors: string;
  compatible_career: string;
}

export default function TeacherStudentInterestsPage() {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const [rows, setRows] = useState<InterestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('');
  const [studentLang, setStudentLang] = useState<string>('en');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    (async () => {
      setLoading(true);
      const { data: student } = await supabase
        .from('students').select('user_id, users:user_id(full_name, preferred_language)')
        .eq('id', studentId).maybeSingle();

      if (!student) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setStudentName((student as any)?.users?.full_name || 'Student');
      setStudentLang((student as any)?.users?.preferred_language || 'en');

      // things_that_interest_me.student_id references users.id, not students.id
      const userId = (student as any)?.user_id;
      const { data } = await supabase
        .from('things_that_interest_me')
        .select('subject, lesson_chapter, why_factors, compatible_career')
        .eq('student_id', userId)
        .order('created_at', { ascending: true });
      setRows(data || []);
      setLoading(false);
    })();
  }, [studentId]);

  const s = STRINGS[studentLang] || STRINGS.en;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 text-gray-500">
        <p>{s.not_found}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 text-white">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                <Heart className="h-5 w-5" /> {s.title}
              </h1>
              <p className="text-white/70 text-sm">{studentName}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6">
        {rows.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Heart className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>{s.empty}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl shadow-sm bg-white border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="text-left px-6 py-4 font-semibold rounded-tl-xl">#</th>
                  <th className="text-left px-6 py-4 font-semibold">{s.col_subject}</th>
                  <th className="text-left px-6 py-4 font-semibold">{s.col_lesson}</th>
                  <th className="text-left px-6 py-4 font-semibold">{s.col_why}</th>
                  <th className="text-left px-6 py-4 font-semibold rounded-tr-xl">{s.col_career}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-500 font-medium">{i + 1}</td>
                    <td className="px-6 py-3 text-gray-700">{row.subject || <span className="text-gray-400 italic">—</span>}</td>
                    <td className="px-6 py-3 text-gray-700">{row.lesson_chapter || <span className="text-gray-400 italic">—</span>}</td>
                    <td className="px-6 py-3 text-gray-700">{row.why_factors || <span className="text-gray-400 italic">—</span>}</td>
                    <td className="px-6 py-3 text-gray-700">{row.compatible_career || <span className="text-gray-400 italic">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
