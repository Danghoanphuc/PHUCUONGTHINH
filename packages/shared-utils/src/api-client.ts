import axios, { AxiosInstance, AxiosError } from "axios";

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
    path: string;
  };
}

export interface ApiClientOptions {
  baseURL: string;
  getToken?: () => string | null;
  onUnauthorized?: () => void;
}

export class ApiClient {
  private client: AxiosInstance;
  private options: ApiClientOptions;

  constructor(options: ApiClientOptions) {
    this.options = options;

    this.client = axios.create({
      baseURL: options.baseURL,
      // Do NOT set Content-Type here - let browser/axios set it automatically
      // This allows FormData to use multipart/form-data with correct boundary
    });

    // Request interceptor: attach JWT token and handle Content-Type
    this.client.interceptors.request.use((config) => {
      const token = options.getToken?.();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // If data is FormData, remove Content-Type to let browser set it with boundary
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      } else if (!config.headers['Content-Type']) {
        // Default to JSON only for non-FormData requests
        config.headers['Content-Type'] = 'application/json';
      }
      
      return config;
    });

    // Response interceptor: handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          options.onUnauthorized?.();
        }
        return Promise.reject(error);
      },
    );
  }

  private unwrap<T>(responseData: unknown): T {
    const d = responseData as { data?: T };
    return (d?.data !== undefined ? d.data : responseData) as T;
  }

  async get<T>(url: string, config?: object): Promise<T> {
    const res = await this.client.get(url, config);
    return this.unwrap<T>(res.data);
  }

  async getRaw<T>(url: string, config?: object): Promise<T> {
    const res = await this.client.get(url, config);
    return res.data as T;
  }

  async post<T>(url: string, data?: unknown, config?: object): Promise<T> {
    const res = await this.client.post(url, data, config);
    return this.unwrap<T>(res.data);
  }

  async put<T>(url: string, data?: unknown, config?: object): Promise<T> {
    const res = await this.client.put(url, data, config);
    return this.unwrap<T>(res.data);
  }

  async patch<T>(url: string, data?: unknown, config?: object): Promise<T> {
    const res = await this.client.patch(url, data, config);
    return this.unwrap<T>(res.data);
  }

  async delete<T>(url: string, config?: object): Promise<T> {
    const res = await this.client.delete(url, config);
    return this.unwrap<T>(res.data);
  }
}

/**
 * Factory function to create an ApiClient instance.
 * Consumers provide their own token retrieval and unauthorized callback
 * so this package stays framework-agnostic.
 */
export function createApiClient(options: ApiClientOptions): ApiClient {
  return new ApiClient(options);
}
