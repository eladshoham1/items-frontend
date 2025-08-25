import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getAuth } from 'firebase/auth';
import { API_CONFIG, FEATURES } from '../config/app.config';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: API_CONFIG.HEADERS,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      async (config) => {
        try {
          const auth = getAuth();
          const user = auth.currentUser;
          if (user) {
            const token = await user.getIdToken();
            (config.headers as any).Authorization = `Bearer ${token}`;
          }
        } catch {
          // ignore token retrieval errors
        }

        if (FEATURES.ENABLE_LOGGING) {
          // console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => {
        if (FEATURES.ENABLE_LOGGING) {
          // console.error('❌ Request Error:', error);
        }
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        if (FEATURES.ENABLE_LOGGING) {
          // console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        }
        return response;
      },
      (error) => {
        if (FEATURES.ENABLE_LOGGING) {
          // console.error('❌ Response Error:', error);
        }

        // Handle authentication errors
        if (error.response?.status === 401) {
          const auth = getAuth();
          if (auth.currentUser) {
            // Token may be expired; optional refresh could be added here
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.delete<T>(url, config);
    return response.data;
  }

  // Special method for blob responses (PDFs, images, etc.)
  async getBlob(url: string, config?: AxiosRequestConfig): Promise<Blob> {
    const response = await this.api.get(url, { 
      ...config, 
      responseType: 'blob',
      timeout: 60000 // 60 seconds timeout for blob downloads
    });
    return response.data;
  }
}

// Export singleton instance
export const apiService = new ApiService();
