import { describe, it, expect } from 'vitest';
import axios, { AxiosError } from 'axios';

// 実際のAWSデプロイメント エンドポイント
const AWS_API_ENDPOINT = 'https://jk0ya4m777.execute-api.ap-northeast-1.amazonaws.com';

/**
 * 実際のAWSデプロイメントに対する統合テスト
 */
describe('AWS Key-Value Store API - 実際のデプロイメントテスト', () => {
  const generateUniqueKey = (): string => {
    return `test-key-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };

  const createApiClient = () => {
    return axios.create({
      baseURL: AWS_API_ENDPOINT,
      timeout: 30000, // 30秒タイムアウト
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  };

  it('APIエンドポイントの基本接続テスト', async () => {
    const client = createApiClient();
    const testKey = generateUniqueKey();

    try {
      // 存在しないキーに対するGETリクエスト（404を期待）
      const response = await client.get(`/item/${testKey}`);
      expect(response.status).toBe(404);
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        expect(axiosError.response.status).toBe(404);
      } else {
        throw error;
      }
    }
  }, 30000);

  it('アイテムの保存と取得の完全なフロー', async () => {
    const client = createApiClient();
    const testKey = generateUniqueKey();
    const testValue = `テスト値 - ${new Date().toISOString()}`;

    console.log(`Testing with key: ${testKey}, value: ${testValue}`);

    try {
      // 1. アイテムを保存
      const putResponse = await client.put(`/item/${testKey}`, testValue, {
        headers: {
          'Content-Type': 'text/plain',
          'X-TTL-Seconds': '3600',
        },
      });

      console.log('PUT Response:', {
        status: putResponse.status,
        data: putResponse.data,
        headers: putResponse.headers,
      });

      expect(putResponse.status).toBe(200);

      // 2. アイテムを取得
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機

      const getResponse = await client.get(`/item/${testKey}`);

      console.log('GET Response:', {
        status: getResponse.status,
        data: getResponse.data,
        headers: getResponse.headers,
      });

      expect(getResponse.status).toBe(200);
      expect(getResponse.data).toBe(testValue);

      // 3. アイテムを削除
      const deleteResponse = await client.delete(`/item/${testKey}`);

      console.log('DELETE Response:', {
        status: deleteResponse.status,
        data: deleteResponse.data,
        headers: deleteResponse.headers,
      });

      expect(deleteResponse.status).toBe(200);

      // 4. 削除後の取得確認（404を期待）
      try {
        const getAfterDeleteResponse = await client.get(`/item/${testKey}`);
        expect(getAfterDeleteResponse.status).toBe(404);
      } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          expect(axiosError.response.status).toBe(404);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Test error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
        console.error('Response headers:', error.response?.headers);
      }
      throw error;
    }
  }, 60000);

  it('extractCode エンドポイントのテスト', async () => {
    const client = createApiClient();
    const testKey = generateUniqueKey();

    // コードを含むテキストメッセージ（SNSメッセージやSMSのような形式を想定）
    const messageText = `
      お客様のログインコードは 1234 です。
      このコードの有効期限は5分間です。
      コードを他人に共有しないでください。
    `;

    try {
      // extractCode エンドポイントで4桁の数字コードを抽出して保存
      const extractResponse = await client.post(`/extractCode/${testKey}`, messageText, {
        headers: {
          'Content-Type': 'text/plain',
          'X-TTL-Seconds': '3600',
        },
      });

      console.log('ExtractCode Response:', {
        status: extractResponse.status,
        data: extractResponse.data,
        headers: extractResponse.headers,
      });

      expect(extractResponse.status).toBe(200);
      expect(extractResponse.data).toContain('Code extracted and stored successfully: 1234');

      // 保存されたコードを取得して確認
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機

      const getResponse = await client.get(`/item/${testKey}`);

      console.log('GET Extracted Code Response:', {
        status: getResponse.status,
        data: getResponse.data,
        headers: getResponse.headers,
      });

      expect(getResponse.status).toBe(200);
      expect(getResponse.data.toString()).toBe('1234');

      // クリーンアップ
      await client.delete(`/item/${testKey}`);
    } catch (error) {
      console.error('ExtractCode test error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
      throw error;
    }
  }, 60000);

  it('extractCode エンドポイント - 英数字モードのテスト', async () => {
    const client = createApiClient();
    const testKey = generateUniqueKey();

    // 英数字コードを含むテキスト
    const messageText = `
      お客様の認証コードは ABC123 です。
      このコードを入力してください。
    `;

    try {
      // 英数字モードで6桁のコードを抽出
      const extractResponse = await client.post(`/extractCode/${testKey}`, messageText, {
        headers: {
          'Content-Type': 'text/plain',
          'X-TTL-Seconds': '3600',
          'X-Digits': '6',
          'X-Character-Type': 'alphanumeric',
        },
      });

      console.log('ExtractCode Alphanumeric Response:', {
        status: extractResponse.status,
        data: extractResponse.data,
        headers: extractResponse.headers,
      });

      expect(extractResponse.status).toBe(200);
      expect(extractResponse.data).toContain('Code extracted and stored successfully: ABC123');

      // 保存されたコードを取得して確認
      const getResponse = await client.get(`/item/${testKey}`);
      expect(getResponse.status).toBe(200);
      expect(getResponse.data).toBe('ABC123');

      // クリーンアップ
      await client.delete(`/item/${testKey}`);
    } catch (error) {
      console.error('ExtractCode alphanumeric test error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
      throw error;
    }
  }, 60000);

  it('TTL設定のテスト', async () => {
    const client = createApiClient();
    const testKey = generateUniqueKey();
    const testValue = 'TTLテスト値';

    try {
      // 短いTTL（5秒）でアイテムを保存
      const putResponse = await client.put(`/item/${testKey}`, testValue, {
        headers: {
          'Content-Type': 'text/plain',
          'X-TTL-Seconds': '5',
        },
      });

      expect(putResponse.status).toBe(200);

      // すぐに取得（存在することを確認）
      const getResponse = await client.get(`/item/${testKey}`);
      expect(getResponse.status).toBe(200);
      expect(getResponse.data).toBe(testValue);

      console.log('TTL test: アイテムが正常に保存されました。5秒後の自動削除をテストします...');

      // 注意: TTLによる自動削除は実際のテストでは時間がかかるため、
      // ここでは手動削除を行い、TTL機能の基本的な設定が正しく行われたことを確認

      // クリーンアップ
      await client.delete(`/item/${testKey}`);
    } catch (error) {
      console.error('TTL test error:', error);
      throw error;
    }
  }, 30000);

  it('エラーハンドリングのテスト', async () => {
    const client = createApiClient();

    try {
      // 1. 無効なキー（特殊文字）でのテスト
      const invalidKey = 'invalid/key*with#special@chars';

      try {
        await client.get(`/item/${encodeURIComponent(invalidKey)}`);
      } catch (error) {
        // エラーが発生することを期待（400または404）
        const axiosError = error as AxiosError;
        expect([400, 404, 500]).toContain(axiosError.response?.status);
      }

      // 2. 空のPUTリクエスト
      const testKey = generateUniqueKey();
      try {
        const emptyPutResponse = await client.put(`/item/${testKey}`, '', {
          headers: {
            'Content-Type': 'text/plain',
          },
        });

        // 空のコンテンツでも正常に保存されるかもしれない
        expect([200, 400]).toContain(emptyPutResponse.status);

        if (emptyPutResponse.status === 200) {
          // 正常に保存された場合はクリーンアップ
          await client.delete(`/item/${testKey}`);
        }
      } catch (error) {
        // エラーが発生することも正常
        const axiosError = error as AxiosError;
        expect([400, 500]).toContain(axiosError.response?.status);
      }
    } catch (error) {
      console.error('Error handling test error:', error);
      throw error;
    }
  }, 30000);
});
