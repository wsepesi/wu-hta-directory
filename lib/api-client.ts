import { ApiResponse } from './types';

export interface ApiClientConfig {
  baseUrl?: string;
  headers?: HeadersInit;
}

export class ApiClient {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor(config?: ApiClientConfig) {
    this.baseUrl = config?.baseUrl || '/api';
    this.headers = {
      'Content-Type': 'application/json',
      ...config?.headers,
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('Content-Type');
    
    if (!response.ok) {
      let error = `HTTP error! status: ${response.status}`;
      
      if (contentType?.includes('application/json')) {
        try {
          const errorData = await response.json();
          error = errorData.error || errorData.message || error;
        } catch (e) {
          // Failed to parse error response
        }
      }
      
      return { error };
    }

    if (contentType?.includes('application/json')) {
      try {
        const data = await response.json();
        return { data };
      } catch (e) {
        return { error: 'Failed to parse JSON response' };
      }
    }

    return { data: null as any };
  }

  private async request<T>(
    url: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${url}`, {
        ...options,
        headers: {
          ...this.headers,
          ...options?.headers,
        },
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async get<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'GET',
    });
  }

  async post<T>(
    url: string,
    data?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(
    url: string,
    data?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(
    url: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'DELETE',
    });
  }

  async patch<T>(
    url: string,
    data?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Default instance
export const apiClient = new ApiClient();

// Authentication-aware instance factory
export const createAuthenticatedClient = (token?: string): ApiClient => {
  return new ApiClient({
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
  });
};