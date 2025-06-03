import { describe, it, expect, beforeEach } from 'vitest';
import { deleteItemHandler } from '@handlers/deleteItem';
import { KeyValueRepository } from '@utils/dynamoDBClient';
import { KeyValueItem } from '@types';
import { setRepository } from '@utils/repositoryFactory';

// テスト用のモックリポジトリクラス
class MockRepository implements KeyValueRepository {
  private items: Map<string, KeyValueItem> = new Map();
  private shouldThrowError: boolean = false;
  public lastDeletedKey: string | null = null;

  constructor() {
    this.reset();
  }

  reset() {
    this.items.clear();
    this.shouldThrowError = false;
    this.lastDeletedKey = null;
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

    const item = { key, value, ttl };
    this.items.set(key, item);
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

    this.lastDeletedKey = key;
    this.items.delete(key);
  }
}

describe('deleteItem handler', () => {
  const mockRepository = new MockRepository();

  beforeEach(() => {
    // 各テスト前にモックリポジトリをリセットして、リポジトリファクトリに設定
    mockRepository.reset();
    setRepository(mockRepository);
  });

  it('should successfully delete an item and return plain text message', async () => {
    const event = {
      pathParameters: {
        key: 'test-key',
      },
    };

    // ハンドラーを呼び出してレスポンスを検証
    const response = await deleteItemHandler(event as any, {} as any, {} as any);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('Item successfully deleted');

    // 正しいキーが削除されたか確認
    expect(mockRepository.lastDeletedKey).toBe('test-key');
  });

  it('should return 400 with plain text message when key is not provided', async () => {
    const event = {
      pathParameters: null,
    };

    const response = await deleteItemHandler(event as any, {} as any, {} as any);

    expect(response.statusCode).toBe(400);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('Key is required');
  });

  it('should return 500 with plain text message when there is an error deleting the item', async () => {
    const event = {
      pathParameters: {
        key: 'error-key', // エラーをトリガーするキー
      },
    };

    const response = await deleteItemHandler(event as any, {} as any, {} as any);

    expect(response.statusCode).toBe(500);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('Error deleting item');
  });
});
