import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_URL } from './setup';

/**
 * APIクライアントクラス - HTTPリクエストを簡単に行うためのラッパー
 */
export class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL = API_URL) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'text/plain',
        'x-api-key': 'test-api-key', // テスト用のAPIキー
      },
    });
  }

  /**
   * GETリクエストを送信
   */
  async get(path: string, config?: AxiosRequestConfig) {
    try {
      const response = await this.client.get(path, config);
      return response;
    } catch (error) {
      if (error.response) {
        return error.response;
      }
      throw error;
    }
  }

  /**
   * PUTリクエストを送信
   */
  async put(path: string, data?: any, config?: AxiosRequestConfig) {
    try {
      const response = await this.client.put(path, data, config);
      return response;
    } catch (error) {
      if (error.response) {
        return error.response;
      }
      throw error;
    }
  }

  /**
   * POSTリクエストを送信
   */
  async post(path: string, data?: any, config?: AxiosRequestConfig) {
    try {
      const response = await this.client.post(path, data, config);
      return response;
    } catch (error) {
      if (error.response) {
        return error.response;
      }
      throw error;
    }
  }

  /**
   * DELETEリクエストを送信
   */
  async delete(path: string, config?: AxiosRequestConfig) {
    try {
      const response = await this.client.delete(path, config);
      return response;
    } catch (error) {
      if (error.response) {
        return error.response;
      }
      throw error;
    }
  }
}
