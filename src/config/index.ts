// Re-export from the new config structure for backward compatibility
export { API_CONFIG, UI_CONFIG, FEATURES } from './app.config';

// Legacy exports for backward compatibility
export const SERVER_URL = process.env.API_URL || 'http://localhost:3001';
export const TABLE_PAGE_SIZE = 20;
