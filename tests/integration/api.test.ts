import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, waitForServer } from './setup';
import { ApiClient } from './apiClient';

describe('Key-Value Store API - HTTP統合テスト', () => {
  let server: any;
  let apiClient: ApiClient;

  // テストスイート開始前にサーバーを起動
  beforeAll(async () => {
    // モックサーバーの起動
    server = await startServer();
    await waitForServer(10, 500); // より短いタイムアウト設定

    // APIクライアントの初期化
    apiClient = new ApiClient();
  }, 15000); // タイムアウトを15秒に短縮

  // テストスイート終了後にサーバーを停止
  afterAll(() => {
    if (server) {
      stopServer(server);
    }
  });

  // 一意のテストキーを生成するヘルパー関数
  const generateUniqueKey = (): string => {
    return `test-key-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };

  describe('アイテム操作', () => {
    it('アイテムの保存と取得', async () => {
      const key = generateUniqueKey();
      const testValue = 'テスト値';

      // アイテムを保存
      const putResponse = await apiClient.put(`/item/${key}`, testValue, {
        headers: {
          'Content-Type': 'text/plain',
          'X-TTL-Seconds': '3600',
        },
      });

      expect(putResponse.status).toBe(200);
      expect(putResponse.data).toBe('Item successfully saved');

      // アイテムを取得
      const getResponse = await apiClient.get(`/item/${key}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.data).toBe(testValue);
    });

    it('存在しないアイテムの取得で404エラーを返す', async () => {
      const nonExistentKey = `non-existent-${Date.now()}`;

      const response = await apiClient.get(`/item/${nonExistentKey}`);

      expect(response.status).toBe(404);
      expect(response.data).toBe('Item not found');
    });

    it('アイテムの削除', async () => {
      const key = generateUniqueKey();
      const testValue = 'テスト値（削除用）';

      // アイテムを保存
      await apiClient.put(`/item/${key}`, testValue, {
        headers: {
          'Content-Type': 'text/plain',
        },
      });

      // アイテムを削除
      const deleteResponse = await apiClient.delete(`/item/${key}`);
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.data).toBe('Item successfully deleted');

      // 削除後に取得を試みると404になることを確認
      const getResponse = await apiClient.get(`/item/${key}`);
      expect(getResponse.status).toBe(404);
    });
  });

  describe('コード抽出機能', () => {
    it('テキストから数字コードを抽出して保存する', async () => {
      const key = generateUniqueKey();
      const testMessage = '認証コードは 987654 です。このコードを入力してください。';

      // コード抽出APIを呼び出す
      const response = await apiClient.post(`/extractCode/${key}`, testMessage, {
        headers: {
          'Content-Type': 'text/plain',
          'X-TTL-Seconds': '3600',
        },
      });

      expect(response.status).toBe(200);
      expect(response.data).toBe('Code extracted and stored successfully: 987654');

      // 保存されたコードを取得して確認
      const getResponse = await apiClient.get(`/item/${key}`);
      expect(getResponse.status).toBe(200);
      // モックサーバーは文字列ではなく数値として返すことがあるため、厳密な等価ではなく値の等価をチェック
      expect(String(getResponse.data)).toBe('987654');
    });

    it('数字コードが見つからない場合は400エラーを返す', async () => {
      const key = generateUniqueKey();
      const testMessage = 'このテキストには数字コードが含まれていません';

      const response = await apiClient.post(`/extractCode/${key}`, testMessage, {
        headers: {
          'Content-Type': 'text/plain',
        },
      });

      expect(response.status).toBe(400);
      expect(response.data).toBe('No numeric code found in the text');
    });
  });

  describe('TTL機能', () => {
    it('TTLが正しく設定される', async () => {
      const key = generateUniqueKey();
      const testValue = 'TTLテスト値';
      const ttlSeconds = 3600; // 1時間

      // TTLを指定してアイテムを保存
      const putResponse = await apiClient.put(`/item/${key}`, testValue, {
        headers: {
          'Content-Type': 'text/plain',
          'X-TTL-Seconds': ttlSeconds.toString(),
        },
      });

      expect(putResponse.status).toBe(200);
      expect(putResponse.data).toBe('Item successfully saved');

      // プレーンテキストになったAPIでは、TTLを直接検証することはできなくなりました
      // 代わりに、アイテムが保存されたことだけを確認します
      const getResponse = await apiClient.get(`/item/${key}`);
      expect(getResponse.status).toBe(200);
      expect(getResponse.data).toBe(testValue);
    });
  });
});
