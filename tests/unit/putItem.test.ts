import { describe, it, expect, beforeEach } from 'vitest';
import { putItemHandler } from '../../src/handlers/putItem';
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

    // エラーをシミュレートするキー
    if (key === 'error-key') {
      throw new Error('Database connection error');
    }

    this.items.delete(key);
  }
}

describe('putItem handler', () => {
  const mockRepository = new MockRepository();

  beforeEach(() => {
    // 各テスト前にモックリポジトリをリセットして、リポジトリファクトリに設定
    mockRepository.reset();
    setRepository(mockRepository);
  });

  it('should successfully store an item and return plain text message', async () => {
    const event = {
      pathParameters: {
        key: 'test-key',
      },
      body: 'test-value', // プレーンテキストの値
      headers: {
        'x-ttl': '3600', // 1時間のTTL
      },
    };

    // ハンドラーを呼び出してレスポンスを検証
    const response = await putItemHandler(event as any, {} as any, {} as any);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('Item successfully saved');

    // モックリポジトリに正しく保存されたか確認
    expect(mockRepository.lastSavedItem).not.toBeNull();
    expect(mockRepository.lastSavedItem?.key).toBe('test-key');
    expect(mockRepository.lastSavedItem?.value).toBe('test-value');
    // TTLは現在時刻に基づいて計算されるため、正確な値ではなく存在するかだけ確認
    expect(mockRepository.lastSavedItem?.ttl).toBeDefined();
  });

  it('should return 400 with plain text message when key is not provided', async () => {
    const event = {
      pathParameters: null,
      body: 'test-value',
    };

    const response = await putItemHandler(event as any, {} as any, {} as any);

    expect(response.statusCode).toBe(400);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('Key is required');
  });

  it('should return 400 with plain text message when value is not provided', async () => {
    const event = {
      pathParameters: {
        key: 'test-key',
      },
      body: '',
    };

    const response = await putItemHandler(event as any, {} as any, {} as any);

    expect(response.statusCode).toBe(400);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('Value is required in the request body');
  });

  it('should return 500 with plain text message when there is an error saving the item', async () => {
    const event = {
      pathParameters: {
        key: 'error-key', // エラーをトリガーするキー
      },
      body: 'test-value',
    };

    const response = await putItemHandler(event as any, {} as any, {} as any);

    expect(response.statusCode).toBe(500);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('Error saving item');
  });
});
