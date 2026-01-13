import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosProgressEvent } from 'axios';
import { ApiResponse, PaginatedResponse } from '../types';
import { encryptionService } from './encryptionService';

class ApiService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add authentication token
        const token = this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add CSRF token for state-changing requests
        if (['post', 'put', 'patch', 'delete'].includes(config.method || '')) {
          const csrfToken = this.getCSRFToken();
          if (csrfToken) {
            config.headers['X-CSRFToken'] = csrfToken;
          }
        }

        // Encrypt sensitive data in request body
        if (config.data && this.shouldEncryptRequest(config.url || '')) {
          config.data = this.encryptRequestData(config.data);
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
        // Decrypt sensitive data in response
        if (response.data && this.shouldDecryptResponse(response.config.url || '')) {
          response.data = this.decryptResponseData(response.data);
        }
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.handleUnauthorized();
        } else if (error.response?.status === 403) {
          // Insufficient permissions
          this.handleForbidden();
        }
        return Promise.reject(error);
      }
    );
  }

  private getStoredToken(): string | null {
    try {
      const encryptedToken = localStorage.getItem('theracare_token');
      return encryptedToken ? encryptionService.decrypt(encryptedToken) : null;
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  }

  private getCSRFToken(): string | null {
    // Extract CSRF token from meta tag or cookie
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : null;
  }

  private shouldEncryptRequest(url: string): boolean {
    // Define endpoints that require encryption
    // Temporarily disable encryption for auth endpoints to fix login
    const encryptedEndpoints = [
      '/patients/',
      '/messages/',
      '/soap-notes/',
      '/billing/',
    ];
    return encryptedEndpoints.some(endpoint => url.includes(endpoint));
  }

  private shouldDecryptResponse(url: string): boolean {
    return this.shouldEncryptRequest(url);
  }

  private encryptRequestData(data: any): any {
    try {
      return {
        encrypted_data: encryptionService.encrypt(JSON.stringify(data)),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error encrypting request data:', error);
      return data; // Fallback to unencrypted data
    }
  }

  private decryptResponseData(data: any): any {
    try {
      if (data.encrypted_data) {
        const decryptedString = encryptionService.decrypt(data.encrypted_data);
        return JSON.parse(decryptedString);
      }
      return data;
    } catch (error) {
      console.error('Error decrypting response data:', error);
      return data; // Fallback to original data
    }
  }

  private handleUnauthorized(): void {
    // Clear stored credentials
    localStorage.removeItem('theracare_token');
    
    // Redirect to login
    window.location.href = '/login';
  }

  private handleForbidden(): void {
    // Show access denied message
    console.error('Access denied - insufficient permissions');
  }

  // Generic GET request
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.get(url, config);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // Generic POST request
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.post(url, data, config);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // Generic PUT request
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.put(url, data, config);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // Generic PATCH request
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.patch(url, data, config);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // Generic DELETE request
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.delete(url, config);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // Paginated GET request
  async getPaginated<T>(
    url: string, 
    params?: { page?: number; limit?: number; [key: string]: any },
    config?: AxiosRequestConfig
  ): Promise<PaginatedResponse<T>> {
    try {
      const response: AxiosResponse<PaginatedResponse<T>> = await this.client.get(url, {
        ...config,
        params: {
          page: 1,
          limit: 20,
          ...params,
        },
      });
      return response.data;
    } catch (error: any) {
      return this.handlePaginatedError(error, params?.page || 1, params?.limit || 20);
    }
  }

  // File upload
  async uploadFile(
    url: string,
    file: File,
    onProgress?: (progressEvent: AxiosProgressEvent) => void
  ): Promise<ApiResponse<any>> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response: AxiosResponse<ApiResponse<any>> = await this.client.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: onProgress,
      });

      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // Download file
  async downloadFile(url: string, filename: string): Promise<void> {
    try {
      const response = await this.client.get(url, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  private handleError(error: any): ApiResponse<any> {
    if (error.response) {
      // Server responded with an error status
      return {
        success: false,
        message: error.response.data?.message || 'An error occurred',
        errors: error.response.data?.errors || [error.response.statusText],
      };
    } else if (error.request) {
      // Network error
      return {
        success: false,
        message: 'Network error - please check your connection',
        errors: ['Network error'],
      };
    } else {
      // Other error
      return {
        success: false,
        message: error.message || 'An unexpected error occurred',
        errors: [error.message || 'Unknown error'],
      };
    }
  }

  private handlePaginatedError(error: any, page: number, limit: number): PaginatedResponse<any> {
    if (error.response) {
      // Server responded with an error status
      return {
        success: false,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    } else if (error.request) {
      // Network error
      return {
        success: false,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    } else {
      // Other error
      return {
        success: false,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health');
      return response.success;
    } catch (error) {
      return false;
    }
  }

  // Set authentication token
  setAuthToken(token: string): void {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('auth_token', token);
    } else {
      delete this.client.defaults.headers.common['Authorization'];
      localStorage.removeItem('auth_token');
    }
  }

  // Get current auth token
  getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Clear authentication
  clearAuth(): void {
    this.setAuthToken('');
  }
}

export const apiService = new ApiService();