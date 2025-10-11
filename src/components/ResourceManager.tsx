import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

type Resource = {
  id: string;
  title: string;
  description: string | null;
  type: 'pdf' | 'video' | 'chart' | 'slides' | 'worksheet' | 'template' | 'guide';
  file_url: string | null;
  tags: string[];
  is_active: boolean;
  created_at: string;
};

const activityTags = [
  { key: 'inspiration', label: 'Inspiration' },
  { key: 'dreams', label: 'Dreams' },
  { key: 'state_learning', label: 'State' },
  { key: 'role_models', label: 'Role Models' },
  { key: 'hobbies', label: 'Hobbies' },
];

const resourceTypes: Resource['type'][] = ['pdf', 'video', 'chart', 'slides', 'worksheet', 'template', 'guide'];

export function ResourceManager() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [newRes, setNewRes] = useState<{ title: string; url: string; type: Resource['type'] | ''; desc: string; tags: string[]; active: 'true' | 'false'; }>(
    { title: '', url: '', type: '', desc: '', tags: [], active: 'true' }
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadResources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('counselling_resources')
        .select('id,title,description,type,file_url,tags,is_active,created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setResources((data as any) || []);
    } catch (err) {
      console.error('Load resources error:', err);
      setErrorMsg('Resources backend not yet set up or permission denied.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadResources(); }, []);

  const filtered = useMemo(() => {
    return resources.filter(r => {
      if (filterType !== 'all' && r.type !== filterType) return false;
      if (filterTag !== 'all' && !r.tags?.includes(filterTag)) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${r.title} ${r.description || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [resources, search, filterType, filterTag]);

  const validateUrl = (url: string) => {
    try {
      const u = new URL(url);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch { return false; }
  };

  const addResource = async () => {
    setErrorMsg(null);
    if (!newRes.title || !newRes.type || !newRes.url || newRes.tags.length === 0) {
      setErrorMsg('Please fill title, type, URL and at least one activity tag.');
      return;
    }
    if (!validateUrl(newRes.url)) {
      setErrorMsg('Please provide a valid http(s) URL.');
      return;
    }
    try {
      const payload = {
        title: newRes.title,
        description: newRes.desc || null,
        type: newRes.type,
        file_url: newRes.url,
        tags: newRes.tags,
        is_active: newRes.active === 'true',
      } as const;
      const { error } = await supabase.from('counselling_resources').insert(payload);
      if (error) throw error;
      setAddOpen(false);
      setNewRes({ title: '', url: '', type: '', desc: '', tags: [], active: 'true' });
      loadResources();
    } catch (err) {
      console.error('Add resource error:', err);
      setErrorMsg('Could not add resource.');
    }
  };

  const toggleActive = async (res: Resource) => {
    try {
      const { error } = await supabase
        .from('counselling_resources')
        .update({ is_active: !res.is_active })
        .eq('id', res.id);
      if (error) throw error;
      setResources(prev => prev.map(r => r.id === res.id ? { ...r, is_active: !r.is_active } : r));
    } catch (err) {
      console.error('Toggle active error:', err);
    }
  };

  const removeResource = async (res: Resource) => {
    if (!confirm('Delete this resource?')) return;
    try {
      const { error } = await supabase
        .from('counselling_resources')
        .delete()
        .eq('id', res.id);
      if (error) throw error;
      setResources(prev => prev.filter(r => r.id !== res.id));
    } catch (err) {
      console.error('Delete resource error:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
        <div className="flex-1">
          <Label>Search</Label>
          <Input placeholder="Search by title or description" value={search} onChange={(e)=> setSearch(e.target.value)} />
        </div>
        <div>
          <Label>Type</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {resourceTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Activity</Label>
          <Select value={filterTag} onValueChange={setFilterTag}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All activities" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {activityTags.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="md:ml-auto">
          <Button className="bg-green-600 hover:bg-green-700" onClick={()=> setAddOpen(true)}>Add Resource</Button>
        </div>
      </div>

      {errorMsg && <div className="text-sm text-red-600">{errorMsg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="text-gray-600 text-sm">Loading resources…</div>
        ) : filtered.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 text-center text-gray-600">
              No resources yet. You can add external links now; file uploads can be enabled later.
            </CardContent>
          </Card>
        ) : (
          filtered.map(r => (
            <Card key={r.id} className="border shadow-sm">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-900">{r.title}</div>
                  <Badge variant="outline">{r.type}</Badge>
                </div>
                <div className="text-sm text-gray-600 line-clamp-2">{r.description || '—'}</div>
                <div className="flex flex-wrap gap-1">
                  {r.tags?.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()}</div>
                  <div className="flex gap-2">
                    {r.file_url && <Button size="sm" variant="outline" onClick={()=> window.open(r.file_url!, '_blank')}>Open</Button>}
                    <Button size="sm" variant="outline" onClick={()=> toggleActive(r)}>{r.is_active ? 'Deactivate' : 'Activate'}</Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={()=> removeResource(r)}>Delete</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
            <DialogDescription>Add an external URL and tag it to activities. File uploads can be enabled later.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input value={newRes.title} onChange={(e)=> setNewRes(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g., Self-discovery worksheet" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={newRes.type || ''} onValueChange={(v)=> setNewRes(prev => ({ ...prev, type: v as any }))}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {resourceTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>External URL</Label>
              <Input value={newRes.url} onChange={(e)=> setNewRes(prev => ({ ...prev, url: e.target.value }))} placeholder="https://…" />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea value={newRes.desc} onChange={(e)=> setNewRes(prev => ({ ...prev, desc: e.target.value }))} placeholder="How to use this resource" />
            </div>
            <div>
              <Label>Activity Tags</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {activityTags.map(t => {
                  const selected = newRes.tags.includes(t.key);
                  return (
                    <Button key={t.key} type="button" variant={selected ? 'default' : 'outline'} size="sm" onClick={()=> setNewRes(prev => ({ ...prev, tags: selected ? prev.tags.filter(x=>x!==t.key) : [...prev.tags, t.key] }))}>
                      {t.label}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={newRes.active} onValueChange={(v)=> setNewRes(prev => ({ ...prev, active: v as any }))}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {errorMsg && <div className="text-sm text-red-600">{errorMsg}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={()=> setAddOpen(false)}>Cancel</Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={addResource}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ResourceManager;


