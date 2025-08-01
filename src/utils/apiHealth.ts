import { API_CONFIG } from '../config/app.config';

export const checkApiHealth = async (): Promise<{
  isHealthy: boolean;
  error?: string;
  url: string;
  corsError?: boolean;
}> => {
  const healthUrl = `${API_CONFIG.BASE_URL}/health`;
  
  try {
    // First attempt with fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log('API Health Check Response:', response.status, response.statusText);
    console.log('Response Headers:', response.headers);
    
    return {
      isHealthy: response.ok,
      error: response.ok ? undefined : `${response.status} ${response.statusText}`,
      url: healthUrl,
      corsError: false
    };
  } catch (error: any) {
    console.error('API Health Check Failed:', error);
    
    // Enhanced error detection
    const isCorsError = error.message?.includes('CORS') || 
                       error.message?.includes('Access-Control-Allow-Origin') ||
                       error.message?.includes('NetworkError') ||
                       (error.name === 'TypeError' && (
                         error.message?.includes('fetch') ||
                         error.message?.includes('Failed to fetch') ||
                         error.message?.includes('Network request failed')
                       ));
    
    const isTimeoutError = (error.name === 'AbortError') || (error.message?.includes('timeout'));
    const isConnectionError = (error.message?.includes('ECONNREFUSED')) || 
                             (error.message?.includes('ERR_CONNECTION_REFUSED')) ||
                             (error.message?.includes('net::ERR_CONNECTION_REFUSED'));
    
    let errorMessage = 'Network error';
    if (isTimeoutError) {
      errorMessage = 'Request timeout - server may be down';
    } else if (isConnectionError) {
      errorMessage = 'Connection refused - server is not running';
    } else if (isCorsError) {
      errorMessage = 'CORS error - server CORS configuration issue';
    } else {
      errorMessage = error.message || 'Unknown network error';
    }
    
    return {
      isHealthy: false,
      error: errorMessage,
      url: healthUrl,
      corsError: isCorsError
    };
  }
};
