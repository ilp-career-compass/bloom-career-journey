import { supabase } from '@/integrations/supabase/client';

export async function fetchTranslations(
  resourceType: string,
  keys: string[],
  lang: 'en' | 'kn' | 'ta'
): Promise<Record<string, string>> {
  if (!keys.length) return {};
  const { data, error } = await supabase
    .from('content_translations')
    .select('resource_key,text')
    .eq('resource_type', resourceType)
    .eq('lang', lang)
    .in('resource_key', keys);
  if (error) {
    console.warn('fetchTranslations error:', error);
    return {};
  }
  const map: Record<string, string> = {};
  (data || []).forEach(row => {
    if (row?.resource_key && row?.text) map[row.resource_key] = row.text;
  });
  return map;
}


