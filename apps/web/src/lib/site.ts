export const SITE = {
  name: 'Typ2-Kompass',
  defaultLocale: 'de-DE',
  url: import.meta.env.PUBLIC_SITE_URL ?? 'https://typ2-kompass.de',
  publisher: {
    name: 'Typ2-Kompass',
    logo: '/logo.svg',
  },
  author: {
    name: 'Redaktion Typ2-Kompass',
    role: 'Editorial Team',
  },
  description:
    'Verständliche, evidenzbasierte Inhalte und digitale Werkzeuge für Menschen mit Typ-2-Diabetes.',
} as const;

export const ARTICLE_BASE_URL = SITE.url;

export function absoluteUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE.url}${normalized}`;
}

export function formatGermanDate(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
