import axios from 'axios';
import { API_URL } from './setup';
/**
 * APIクライアントクラス - HTTPリクエストを簡単に行うためのラッパー
 */
export class ApiClient {
  client;
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
  async get(path, config) {
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
  async put(path, data, config) {
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
  async post(path, data, config) {
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
  async delete(path, config) {
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
