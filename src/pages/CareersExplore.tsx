import React, { useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { useLang } from '@/hooks/useLang';
import { ArrowLeft } from 'lucide-react';

// Discover career images under public/career_cards (preferred) then src/assets/career_cards
const publicImages = import.meta.glob('/career_cards/*.{png,jpg,jpeg,webp,svg}', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>;

const srcImages = import.meta.glob('/src/assets/career_cards/*.{png,jpg,jpeg,webp,svg}', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>;

const srcRootImages = import.meta.glob('/src/career_cards/*.{png,jpg,jpeg,webp,svg}', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>;

export default function CareersExplore() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const [q, setQ] = useState('');
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const items = useMemo(() => {
    const pub = Object.entries(publicImages);
    if (pub.length > 0) return pub.map(([path, url]) => ({ path, url }));
    const srcA = Object.entries(srcImages);
    if (srcA.length > 0) return srcA.map(([path, url]) => ({ path, url }));
    const root = Object.entries(srcRootImages);
    return root.map(([path, url]) => ({ path, url }));
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const term = q.toLowerCase();
    return items.filter(i => i.path.toLowerCase().includes(term));
  }, [items, q]);

  const toTitle = useCallback((p: string) => {
    const base = p.split('/').pop() || p;
    const name = base.replace(/\.[^.]+$/, '');
    return name.replace(/[-_]+/g, ' ').replace(/\b\w/g, s => s.toUpperCase());
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50" lang={lang} dir="auto">
      <div className="container mx-auto px-4 py-8">
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-2xl text-gray-800">Explore Careers</CardTitle>
              <Button
                variant="ghost"
                onClick={() => navigate(`/student?lang=${lang}`)}
                className="w-full sm:w-auto justify-start sm:justify-center text-blue-700 hover:text-blue-800 hover:bg-blue-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {lang === 'kn' ? 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ' : lang === 'ta' ? 'முதல் பக்கத்திற்கு திரும்பு' : lang === 'hi' ? 'डैशबोर्ड पर वापस' : 'Back to Dashboard'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Input placeholder="Search careers (e.g., Accountant, Animator)" value={q} onChange={(e) => setQ(e.target.value)} />
          </CardContent>
        </Card>

        {filtered.length === 0 ? (
          <div className="text-center text-gray-600">No careers found. Ensure images are placed under <code>public/career_cards</code>, <code>src/assets/career_cards</code>, or <code>src/career_cards</code>.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((item) => (
              <Card key={item.path} className="border-0 shadow-md hover:shadow-xl transition-all duration-200 rounded-xl overflow-hidden group">
                <div className="bg-white">
                  <div className="relative">
                    <div className="h-72 bg-gray-100 animate-pulse group-[&>img]:hidden" />
                    <img
                      src={item.url}
                      alt={toTitle(item.path)}
                      className="w-full h-72 object-cover block"
                      loading="lazy"
                      onLoad={(e) => (e.currentTarget.previousElementSibling as HTMLElement).classList.add('hidden')}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <div className="text-white font-semibold text-sm truncate">{toTitle(item.path)}</div>
                    </div>
                  </div>
                  <CardContent className="p-3 flex flex-wrap items-center justify-between gap-2">
                    <Button size="sm" variant="outline" onClick={() => setViewUrl(item.url)} className="flex-1 sm:flex-none">View</Button>
                    <a href={item.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline whitespace-nowrap">Open in new tab</a>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!viewUrl} onOpenChange={(o) => !o && setViewUrl(null)}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>{viewUrl ? 'Career Card' : ''}</DialogTitle>
            </DialogHeader>
            {viewUrl && (
              <div className="max-h-[70vh] overflow-auto rounded-lg border">
                <img src={viewUrl} alt="Career" className="w-full h-auto object-contain" />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}


