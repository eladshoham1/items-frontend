// API Configuration
const API_PREFIX = 'api';

// Helper function to construct the base URL properly
const constructBaseURL = () => {
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  
  // If the URL already includes protocol, use it as is
  if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
    return `${apiUrl}/${API_PREFIX}`;
  }
  
  // If no protocol is specified, add https for production domains
  // and http for localhost
  const protocol = apiUrl.includes('localhost') ? 'http://' : 'https://';
  const finalUrl = `${protocol}${apiUrl}/${API_PREFIX}`;
  
  return finalUrl;
};

export const API_CONFIG = {
  API_PREFIX,
  BASE_URL: constructBaseURL(),
  TIMEOUT: 30000, // Increased timeout to 30 seconds for serverless cold starts
  HEADERS: {
    'Content-Type': 'application/json',
  },
} as const;

// UI Configuration
export const UI_CONFIG = {
  TABLE_PAGE_SIZE: 20,
  DATE_LOCALE: 'he-IL',
  TIME_ZONE: 'Asia/Jerusalem',
  COLD_START_THRESHOLD: 3000, // Show cold start message after 3 seconds
} as const;

// Feature flags or environment-specific settings
export const FEATURES = {
  ENABLE_LOGGING: process.env.NODE_ENV === 'development',
} as const;
