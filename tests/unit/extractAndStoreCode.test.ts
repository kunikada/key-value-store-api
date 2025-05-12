import { describe, it, expect, beforeEach } from 'vitest';
import { extractAndStoreCodeHandler } from '../../src/handlers/extractAndStoreCode';
import { KeyValueRepository } from '../../src/utils/dynamoDBClient';
import { KeyValueItem } from '../../src/types';
import { setRepository } from '../../src/utils/repositoryFactory';

// テスト用のモックリポジトリクラス
class MockRepository implements KeyValueRepository {
  private items: Map<string, KeyValueItem> = new Map();
  private shouldThrowError: boolean = false;
  public lastSavedItem: KeyValueItem | null = null;

  constructor() {
    this.reset();
  }

  reset() {
    this.items.clear();
    this.shouldThrowError = false;
    this.lastSavedItem = null;
  }

  setShouldThrowError(shouldThrow: boolean) {
    this.shouldThrowError = shouldThrow;
  }

  async getItem(key: string): Promise<KeyValueItem | null> {
    if (this.shouldThrowError) {
      throw new Error('Simulated database error');
    }
    return this.items.get(key) || null;
  }

  async putItem(key: string, value: string, ttl: number): Promise<KeyValueItem> {
    if (this.shouldThrowError) {
      throw new Error('Simulated database error');
    }

    // エラーをシミュレートするキー
    if (key === 'error-key') {
      throw new Error('Database connection error');
    }

    const item = { key, value, ttl };
    this.items.set(key, item);
    this.lastSavedItem = item;
    return item;
  }

  async deleteItem(key: string): Promise<void> {
    if (this.shouldThrowError) {
      throw new Error('Simulated database error');
    }
    this.items.delete(key);
  }
}

describe('extractAndStoreCode handler', () => {
  const mockRepository = new MockRepository();

  beforeEach(() => {
    // 各テスト前にモックリポジトリをリセットして、リポジトリファクトリに設定
    mockRepository.reset();
    setRepository(mockRepository);
  });

  it('should extract and store numeric code from text and return plain text message', async () => {
    const event = {
      pathParameters: {
        key: 'test-key',
      },
      body: 'Your verification code is 123456. Please enter this code to continue.',
      headers: {
        'x-ttl': '3600', // 1時間のTTL
      },
    };

    // ハンドラーを呼び出してレスポンスを検証
    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('Code extracted and stored successfully: 123456');

    // モックリポジトリに正しく保存されたか確認
    expect(mockRepository.lastSavedItem).not.toBeNull();
    expect(mockRepository.lastSavedItem?.key).toBe('test-key');
    expect(mockRepository.lastSavedItem?.value).toBe('123456');
    // TTLは現在時刻に基づいて計算されるため、正確な値ではなく存在するかだけ確認
    expect(mockRepository.lastSavedItem?.ttl).toBeDefined();
  });

  it('should return 400 with plain text message when no numeric code is found in the text', async () => {
    const event = {
      pathParameters: {
        key: 'test-key',
      },
      body: 'This text contains no numeric code.',
    };

    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(400);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('No numeric code found in the text');
  });

  it('should return 400 with plain text message when request body is empty', async () => {
    const event = {
      pathParameters: {
        key: 'test-key',
      },
      body: null,
    };

    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(400);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('Request body cannot be empty');
  });

  it('should return 400 with plain text message when key is not provided', async () => {
    const event = {
      pathParameters: null,
      body: 'Your verification code is 123456.',
    };

    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(400);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('Key must be specified in the path');
  });

  it('should extract only the numeric code with 4 or more digits', async () => {
    const event = {
      pathParameters: {
        key: 'test-key',
      },
      body: 'Your verification code is 987654. The order number is 123. Please enter the verification code.',
      headers: {},
    };

    // ハンドラーを呼び出してレスポンスを検証
    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('Code extracted and stored successfully: 987654');

    // モックリポジトリに正しく保存されたか確認
    expect(mockRepository.lastSavedItem).not.toBeNull();
    expect(mockRepository.lastSavedItem?.key).toBe('test-key');
    expect(mockRepository.lastSavedItem?.value).toBe('987654');
  });

  it('should return 500 with plain text message when there is an error saving the item', async () => {
    // データベースエラーをシミュレート
    mockRepository.setShouldThrowError(true);

    const event = {
      pathParameters: {
        key: 'test-key',
      },
      body: 'Your verification code is 123456. Please enter this code to continue.',
    };

    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(500);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('An error occurred while processing your request');
  });
});
