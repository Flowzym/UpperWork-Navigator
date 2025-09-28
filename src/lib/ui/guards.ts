export const hasText = (v?: string | null) => typeof v === 'string' && v.trim().length > 0;
export const hasList = (v?: string[] | null) => Array.isArray(v) && v.length > 0;