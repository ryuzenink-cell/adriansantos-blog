import type { Language } from '../types';

const MONTHS: Record<Language, string[]> = {
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  pt: [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ],
};

/** Converte uma data ISO em um objeto Date de forma segura. */
function parse(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Nome do mês (0-11) no idioma escolhido. */
export function monthName(monthIndex: number, lang: Language): string {
  return MONTHS[lang][monthIndex] ?? '';
}

/** Ex.: "June 7, 2026" (en) ou "7 de Junho de 2026" (pt). */
export function formatLongDate(iso: string, lang: Language): string {
  const d = parse(iso);
  if (!d) return '';
  const day = d.getDate();
  const month = monthName(d.getMonth(), lang);
  const year = d.getFullYear();
  return lang === 'pt'
    ? `${day} de ${month} de ${year}`
    : `${month} ${day}, ${year}`;
}

/** Formato curto YYYY-MM-DD para inputs e tabelas do admin. */
export function toDateInputValue(iso: string): string {
  const d = parse(iso);
  if (!d) return '';
  return d.toISOString().slice(0, 10);
}

/** Data/hora atual em ISO (usada como created_at/updated_at). */
export function nowIso(): string {
  return new Date().toISOString();
}
