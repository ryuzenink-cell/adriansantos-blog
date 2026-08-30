import type { Language } from '../types';

export function textFromHtml(html: string): string {
  if (!html) return '';
  if (typeof document !== 'undefined') {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function estimateReadingMinutes(html: string, language: Language): number {
  const text = textFromHtml(html);
  const words = text ? text.split(/\s+/).length : 0;
  const wordsPerMinute = language === 'pt' ? 200 : 220;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function datesDiffer(first: string, second: string): boolean {
  if (!first || !second) return false;
  const firstTime = new Date(first).getTime();
  const secondTime = new Date(second).getTime();
  if (Number.isNaN(firstTime) || Number.isNaN(secondTime)) return first !== second;
  return firstTime !== secondTime;
}
