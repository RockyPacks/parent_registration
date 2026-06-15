export const isStAndrewsSchool = (schoolName?: string | null): boolean => {
  const normalized = (schoolName || '').toLowerCase().replace(/[-_]+/g, ' ');
  return /\b(st\.?\s+andrews|saint\s+andrews)\b/.test(normalized);
};
