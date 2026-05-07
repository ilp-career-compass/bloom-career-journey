import React, { useLayoutEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, MessageSquare } from 'lucide-react';
import CareerSpotlight from '@/components/CareerSpotlight';
import type { StudentLang } from './studentStrings';

interface ChatMsg {
    id: string;
    role: 'user' | 'model';
    text: string;
}

interface CareerChatSectionProps {
    resolvedLang: StudentLang;
    t: (k: string) => string;
    ccMessages: ChatMsg[];
    ccInput: string;
    setCcInput: (v: string) => void;
    ccCanSend: boolean;
    ccLoading: boolean;
    onSend: () => void;
    ccListRef: React.RefObject<HTMLDivElement>;
}

export default function CareerChatSection({
    resolvedLang, t, ccMessages, ccInput, setCcInput, ccCanSend, ccLoading, onSend, ccListRef,
}: CareerChatSectionProps) {
    useLayoutEffect(() => {
        if (ccListRef.current) {
            ccListRef.current.scrollTop = ccListRef.current.scrollHeight;
        }
    }, [ccMessages.length, ccLoading]);

    return (
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left: Spotlight */}
            <div className="order-2 lg:order-1">
                <CareerSpotlight />
            </div>
            {/* Right: CareerChat */}
            <div className="order-1 lg:order-2 lg:col-span-2">
                <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                        <CardTitle className="text-2xl text-purple-800 flex items-center gap-3">
                            <Bot className="w-6 h-6 text-purple-600" />
                            {t('chat_title')}
                        </CardTitle>
                        <CardDescription className="text-purple-600">
                            {t('chat_desc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4 min-h-[120px] max-h-[300px] overflow-y-auto" ref={ccListRef}>
                                {ccMessages.length === 0 && !ccLoading ? (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                                                <Bot className="w-4 h-4 text-white" />
                                            </div>
                                            <span className="font-medium text-gray-700">CareerBot</span>
                                        </div>
                                        <p className="text-gray-600 text-sm">{t('chat_greeting')}</p>
                                    </div>
                                ) : (
                                    <>
                                        {ccMessages.map(m => (
                                            <div key={m.id} className="mt-3">
                                                <div className="text-xs text-gray-500 mb-1">
                                                    {m.role === 'user'
                                                        ? resolvedLang === 'kn' ? 'ನೀವು' : resolvedLang === 'ta' ? 'நீங்கள்' : resolvedLang === 'hi' ? 'आप' : 'You'
                                                        : 'CareerBot'}
                                                </div>
                                                <div className="text-sm text-gray-700 whitespace-pre-wrap break-words bg-white border rounded p-2">
                                                    {m.text}
                                                </div>
                                            </div>
                                        ))}
                                        {ccLoading && (
                                            <div className="mt-3">
                                                <div className="text-xs text-gray-500 mb-1">CareerBot</div>
                                                <div className="text-sm text-gray-400 bg-white border rounded p-2 italic animate-pulse">
                                                    {resolvedLang === 'kn' ? 'ಯೋಚಿಸುತ್ತಿದ್ದೇನೆ…' : resolvedLang === 'ta' ? 'யோசிக்கிறேன்…' : resolvedLang === 'hi' ? 'सोच रहा हूँ…' : 'Thinking…'}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    lang={resolvedLang}
                                    placeholder={t('chat_placeholder')}
                                    className="flex-1"
                                    value={ccInput}
                                    onChange={(e) => setCcInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (ccCanSend) onSend(); } }}
                                />
                                <Button onClick={onSend} disabled={!ccCanSend} className="bg-purple-600 hover:bg-purple-700">
                                    {ccLoading ? '...' : <MessageSquare className="w-4 h-4" />}
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500 text-center">{t('chat_send_hint')}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
