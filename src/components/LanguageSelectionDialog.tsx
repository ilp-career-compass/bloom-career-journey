import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLang } from '@/hooks/useLang';
import { Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function LanguageSelectionDialog({ open, onOpenChange }: Props) {
    const { userProfile, refreshUserProfile } = useAuth();
    const { setLang } = useLang();
    const [selected, setSelected] = useState<'en' | 'kn' | 'ta' | null>(null);
    const [saving, setSaving] = useState(false);

    const languages = [
        { code: 'en', label: 'English', native: 'English', icon: '🇺🇸' },
        { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', icon: '🇮🇳' },
        { code: 'ta', label: 'Tamil', native: 'தமிழ்', icon: '🇮🇳' },
    ] as const;

    const handleSelect = async () => {
        if (!selected || !userProfile?.id) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    preferred_language: selected,
                    has_selected_language: true
                } as any)
                .eq('id', userProfile.id);

            if (error) throw error;

            // Update local state immediately
            setLang(selected);
            await refreshUserProfile();
            onOpenChange(false);
        } catch (err) {
            console.error('Failed to save language selection:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !saving && onOpenChange(v)}>
            <DialogContent className="sm:max-w-md border-none bg-gradient-to-br from-indigo-900 via-slate-900 to-black text-white overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Globe size={120} className="text-blue-400 animate-pulse" />
                </div>

                <DialogHeader className="relative z-10">
                    <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                        Choose Your Language
                    </DialogTitle>
                    <DialogDescription className="text-slate-300 text-lg">
                        Select the language you are most comfortable with for your career journey.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-6 relative z-10">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => setSelected(lang.code)}
                            className={cn(
                                "group relative flex items-center justify-between p-4 rounded-xl transition-all duration-300 border-2",
                                selected === lang.code
                                    ? "bg-blue-600/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                                    : "bg-slate-800/40 border-slate-700 hover:border-slate-500 hover:bg-slate-800/60"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">{lang.icon}</span>
                                <div className="text-left">
                                    <p className="font-semibold text-white text-lg">{lang.label}</p>
                                    <p className="text-slate-400 text-sm">{lang.native}</p>
                                </div>
                            </div>

                            {selected === lang.code && (
                                <div className="bg-blue-500 rounded-full p-1 shadow-lg animate-in zoom-in duration-300">
                                    <Check size={18} className="text-white" strokeWidth={3} />
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex justify-end relative z-10">
                    <Button
                        onClick={handleSelect}
                        disabled={!selected || saving}
                        className={cn(
                            "w-full py-6 text-lg font-bold rounded-xl transition-all duration-500",
                            selected
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-900/40"
                                : "bg-slate-700 text-slate-400 cursor-not-allowed"
                        )}
                    >
                        {saving ? "Setting things up..." : "Continue Journey"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
