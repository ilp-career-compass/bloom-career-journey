interface VoiceInputNudgeProps {
  lang: string;
}

const LANGUAGE_NAME: Record<string, string> = {
  kn: 'Kannada',
  ta: 'Tamil',
  hi: 'Hindi',
};

export function VoiceInputNudge({ lang }: VoiceInputNudgeProps) {
  if (!['kn', 'ta', 'hi'].includes(lang)) return null;
  if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) return null;

  const languageName = LANGUAGE_NAME[lang];

  return (
    <p className="text-xs text-gray-400 italic mt-1">
      💡 Speaking your answer works best for {languageName} on this device. Use the 🎙️ button to record.
    </p>
  );
}
