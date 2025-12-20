import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../constants/config';
import {
  ApiResponse,
  ApiError,
  API_ERROR_MESSAGES,
  NETWORK_ERROR_MESSAGE,
  TIMEOUT_ERROR_MESSAGE,
  UNKNOWN_ERROR_MESSAGE
} from '../types';

class ApiService {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token to headers
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error: AxiosError) => {
        // Create a structured error
        let apiError: ApiError;

        if (error.response) {
          // Server responded with error status
          const status = error.response.status;
          const errorData = error.response.data as any;

          // Get message from server or use default
          const serverMessage = errorData?.message;
          const defaultMessage = API_ERROR_MESSAGES[status] || UNKNOWN_ERROR_MESSAGE;
          const message = serverMessage || defaultMessage;

          // Get error code and details
          const code = errorData?.error || errorData?.code;
          const details = errorData?.details;

          // Create ApiError instance
          apiError = new ApiError(message, status, code, details, error);

          console.error(`[API Error ${status}]`, message, details || '');

          // Handle specific status codes
          switch (status) {
            case 400:
              // Bad Request - validation error
              if (details) {
                console.error('Validation errors:', details);
              }
              break;

            case 401:
              // Unauthorized - token expired or invalid
              console.log('Unauthorized - triggering re-authentication');
              // Emit event for AuthContext to handle logout
              // You can use EventEmitter or other mechanism here
              break;

            case 403:
              // Forbidden - insufficient permissions
              console.log('Access forbidden');
              break;

            case 404:
              // Not found
              console.log('Resource not found');
              break;

            case 500:
            case 502:
            case 503:
              // Server errors
              console.error('Server error occurred');
              break;
          }
        } else if (error.request) {
          // Request made but no response - network error
          apiError = new ApiError(
            NETWORK_ERROR_MESSAGE,
            undefined,
            'NETWORK_ERROR',
            undefined,
            error
          );
          console.error('Network error - no response received');
        } else if (error.code === 'ECONNABORTED') {
          // Timeout error
          apiError = new ApiError(
            TIMEOUT_ERROR_MESSAGE,
            undefined,
            'TIMEOUT_ERROR',
            undefined,
            error
          );
          console.error('Request timeout');
        } else {
          // Error setting up request
          apiError = new ApiError(
            error.message || UNKNOWN_ERROR_MESSAGE,
            undefined,
            'REQUEST_ERROR',
            undefined,
            error
          );
          console.error('Request setup error:', error.message);
        }

        return Promise.reject(apiError);
      }
    );
  }

  /**
   * Set auth token
   */
  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.get(url, config);
    return response.data.data || (response.data as any);
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.post(url, data, config);
    return response.data.data || (response.data as any);
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.put(url, data, config);
    return response.data.data || (response.data as any);
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.patch(url, data, config);
    return response.data.data || (response.data as any);
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.delete(url, config);
    return response.data.data || (response.data as any);
  }

  /**
   * Upload file
   */
  async uploadFile<T = any>(
    url: string,
    file: File | Blob,
    fieldName: string = 'file',
    additionalData?: Record<string, any>
  ): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);

    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data || (response.data as any);
  }

  /**
   * Check if online
   */
  async checkConnection(): Promise<boolean> {
    try {
      await this.client.get('/health', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
