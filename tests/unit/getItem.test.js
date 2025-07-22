import { describe, it, expect, beforeEach } from 'vitest';
import { getItemHandler } from '../../src/handlers/getItem';
import { setRepository } from '../../src/utils/repositoryFactory';
// テスト用のモックリポジトリクラス
class MockRepository {
    items = new Map();
    shouldThrowError = false;
    constructor() {
        this.reset();
    }
    reset() {
        this.items.clear();
        this.shouldThrowError = false;
    }
    setMockItem(key, value, ttl) {
        this.items.set(key, {
            key,
            value,
            ttl: ttl ?? Math.floor(Date.now() / 1000) + 86400,
        });
    }
    setShouldThrowError(shouldThrow) {
        this.shouldThrowError = shouldThrow;
    }
    async getItem(key) {
        if (this.shouldThrowError) {
            throw new Error('Simulated database error');
        }
        // テスト用の特別なケース
        if (key === 'test-key' && !this.items.has(key)) {
            const futureDate = Math.floor(Date.now() / 1000) + 86400; // 現在から24時間後
            return {
                key: key,
                value: 'test-value',
                ttl: futureDate,
            };
        }
        return this.items.get(key) || null;
    }
    async putItem(key, value, ttl) {
        if (this.shouldThrowError) {
            throw new Error('Simulated database error');
        }
        const item = { key, value, ttl };
        this.items.set(key, item);
        return item;
    }
    async deleteItem(key) {
        if (this.shouldThrowError) {
            throw new Error('Simulated database error');
        }
        this.items.delete(key);
    }
}
describe('getItem handler', () => {
    const mockRepository = new MockRepository();
    beforeEach(() => {
        // 各テスト前にモックリポジトリをリセットして、リポジトリファクトリに設定
        mockRepository.reset();
        setRepository(mockRepository);
    });
    it('should return the item value as plain text when it exists', async () => {
        // モックアイテムを設定（この行が重要）
        const futureDate = Math.floor(Date.now() / 1000) + 86400; // 現在から24時間後
        mockRepository.setMockItem('test-key', 'test-value', futureDate);
        const event = {
            pathParameters: {
                key: 'test-key',
            },
        };
        // ハンドラーを呼び出してレスポンスを検証
        const response = await getItemHandler(event, {}, {});
        expect(response.statusCode).toBe(200);
        expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
        expect(response.body).toBe('test-value');
    });
    it('should return 404 with plain text message when the item does not exist', async () => {
        // アイテムを設定しない（存在しないキー）
        const event = {
            pathParameters: {
                key: 'non-existent-key',
            },
        };
        const response = await getItemHandler(event, {}, {});
        expect(response.statusCode).toBe(404);
        expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
        expect(response.body).toBe('Item not found');
    });
    it('should return 400 with plain text message when key is not provided', async () => {
        const event = {
            pathParameters: null,
        };
        const response = await getItemHandler(event, {}, {});
        expect(response.statusCode).toBe(400);
        expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
        expect(response.body).toBe('Key is required');
    });
    it('should return 500 with plain text message when database error occurs', async () => {
        // データベースエラーをシミュレート
        mockRepository.setShouldThrowError(true);
        const event = {
            pathParameters: {
                key: 'test-key',
            },
        };
        const response = await getItemHandler(event, {}, {});
        expect(response.statusCode).toBe(500);
        expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
        expect(response.body).toBe('Error retrieving item');
    });
    it('should return 404 with plain text message when the item is expired', async () => {
        // 期限切れのアイテムを設定（現在時刻より1時間前）
        const pastDate = Math.floor(Date.now() / 1000) - 3600; // 1時間前
        mockRepository.setMockItem('expired-key', 'expired-value', pastDate);
        const event = {
            pathParameters: {
                key: 'expired-key',
            },
        };
        const response = await getItemHandler(event, {}, {});
        expect(response.statusCode).toBe(404);
        expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
        expect(response.body).toBe('Item not found');
    });
});
