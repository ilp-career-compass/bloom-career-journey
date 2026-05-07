export function flattenResponses(responses: unknown): string {
  if (!responses || typeof responses !== 'object') return '';
  const parts: string[] = [];
  const extract = (obj: unknown) => {
    for (const val of Object.values(obj as Record<string, unknown>)) {
      if (typeof val === 'string' && val.trim()) parts.push(val.trim());
      else if (typeof val === 'object' && val !== null) extract(val);
    }
  };
  extract(responses);
  return parts.join('\n');
}
