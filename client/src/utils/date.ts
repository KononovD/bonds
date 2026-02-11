import { format, parseISO, isValid } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Парсит строку даты/времени (ISO или yyyy-MM-dd).
 */
function parseDate(dateStr: string): Date {
  if (dateStr.includes('T')) return parseISO(dateStr);
  return new Date(dateStr + 'T00:00:00');
}

/**
 * Формат отображения: день месяц год (например, 11 февраля 2025).
 */
export function formatDate(dateStr: string): string {
  const d = parseDate(dateStr);
  if (!isValid(d)) return dateStr;
  return format(d, 'd MMMM yyyy', { locale: ru });
}

/**
 * Формат отображения: день месяц год, часы:минуты.
 */
export function formatDateTime(dateStr: string): string {
  const d = parseDate(dateStr);
  if (!isValid(d)) return dateStr;
  return format(d, 'd MMMM yyyy, HH:mm', { locale: ru });
}

/**
 * Строка только даты для сравнения (yyyy-MM-dd).
 */
export function toDateOnlyString(date: Date | string): string {
  const d = typeof date === 'string' ? parseDate(date) : date;
  return format(d, 'yyyy-MM-dd');
}

/**
 * Значение для input type="datetime-local" (локальное время).
 */
export function toDateTimeLocalValue(isoOrDateStr: string): string {
  const d = parseDate(isoOrDateStr);
  if (!isValid(d)) return '';
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Сохранить: из значения datetime-local в ISO строку.
 */
export function fromDateTimeLocalToISO(dateTimeLocal: string): string {
  if (!dateTimeLocal) return '';
  const d = new Date(dateTimeLocal);
  return isValid(d) ? d.toISOString() : dateTimeLocal;
}

/**
 * При загрузке с бэкенда: если пришла только дата (yyyy-MM-dd), добавить время 00:00 в локальной зоне и вернуть ISO.
 */
export function ensureDateTime(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('T')) return dateStr;
  const d = new Date(dateStr + 'T00:00:00');
  return isValid(d) ? d.toISOString() : dateStr;
}
