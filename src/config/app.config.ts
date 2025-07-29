// API Configuration
const API_PREFIX = 'api';

export const API_CONFIG = {
  API_PREFIX,
  BASE_URL: (process.env.REACT_APP_API_URL || 'http://localhost:3001') + '/' + API_PREFIX,
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
} as const;

// UI Configuration
export const UI_CONFIG = {
  TABLE_PAGE_SIZE: 20,
  DATE_LOCALE: 'he-IL',
  TIME_ZONE: 'Asia/Jerusalem',
} as const;

// Feature flags or environment-specific settings
export const FEATURES = {
  ENABLE_LOGGING: process.env.NODE_ENV === 'development',
} as const;
