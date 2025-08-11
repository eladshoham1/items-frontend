import { UI_CONFIG } from '../config/app.config';

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat(UI_CONFIG.DATE_LOCALE, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: UI_CONFIG.TIME_ZONE,
  }).format(date);
};

export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat(UI_CONFIG.DATE_LOCALE, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: UI_CONFIG.TIME_ZONE,
  }).format(date);
};

export const formatDateString = (dateString: string): string => {
  return formatDate(new Date(dateString));
};

export const getCurrentDate = (): string => {
  return formatDate(new Date());
};
