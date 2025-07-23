import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getTTLConfig,
  calculateTTL,
  getTTLFromHeaders,
  isItemExpired,
} from '../../src/utils/ttlHelper';
describe('ttlHelper', () => {
  const originalEnv = process.env;
  // 各テスト前に環境変数をリセット
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });
  // 各テスト後に環境変数を元に戻す
  afterEach(() => {
    process.env = originalEnv;
  });
  describe('getTTLConfig', () => {
    it('should return default values when environment variables are not set', () => {
      // 環境変数未設定の場合のテスト
      delete process.env.DEFAULT_TTL;
      const config = getTTLConfig();
      expect(config.enabled).toBe(true); // 常に有効
      expect(config.defaultTTL).toBe(86400); // デフォルトは24時間（86400秒）
    });
    it('should use environment variables for DEFAULT_TTL when set', () => {
      // 環境変数設定時のテスト
      process.env.DEFAULT_TTL = '3600';
      const config = getTTLConfig();
      expect(config.enabled).toBe(true);
      expect(config.defaultTTL).toBe(3600);
    });
    it('should handle invalid DEFAULT_TTL values correctly', () => {
      // 無効なDEFAULT_TTL値のテスト
      process.env.DEFAULT_TTL = 'invalid';
      const config = getTTLConfig();
      expect(config.defaultTTL).toBe(86400); // 無効な値の場合はデフォルト値を使用
    });
    it('should handle invalid DEFAULT_TTL values correctly', () => {
      // 無効なDEFAULT_TTL値のテスト
      process.env.DEFAULT_TTL = 'invalid';
      const config = getTTLConfig();
      expect(config.defaultTTL).toBe(86400); // 無効な場合はデフォルト値を使用
    });
  });
  describe('calculateTTL', () => {
    it('should calculate TTL based on current time and provided seconds', () => {
      const nowInSeconds = Math.floor(Date.now() / 1000);
      const ttlSeconds = 3600; // 1時間
      const calculatedTTL = calculateTTL(ttlSeconds);
      // 計算されたTTLが現在時刻+指定秒数と近い値か確認
      expect(calculatedTTL).toBeGreaterThanOrEqual(nowInSeconds + ttlSeconds - 1);
      expect(calculatedTTL).toBeLessThanOrEqual(nowInSeconds + ttlSeconds + 1);
    });
    it('should use default TTL value when seconds are not provided', () => {
      const nowInSeconds = Math.floor(Date.now() / 1000);
      process.env.DEFAULT_TTL = '7200'; // 2時間
      const calculatedTTL = calculateTTL();
      // デフォルト値（環境変数から）が使用されているか確認
      expect(calculatedTTL).toBeGreaterThanOrEqual(nowInSeconds + 7200 - 1);
      expect(calculatedTTL).toBeLessThanOrEqual(nowInSeconds + 7200 + 1);
    });
    it('should use hardcoded default when environment variable is not set', () => {
      const nowInSeconds = Math.floor(Date.now() / 1000);
      delete process.env.DEFAULT_TTL;
      const calculatedTTL = calculateTTL();
      // ハードコードされたデフォルト値（86400秒）が使用されているか確認
      expect(calculatedTTL).toBeGreaterThanOrEqual(nowInSeconds + 86400 - 1);
      expect(calculatedTTL).toBeLessThanOrEqual(nowInSeconds + 86400 + 1);
    });
  });
  describe('getTTLFromHeaders', () => {
    it('should extract TTL from X-TTL-Seconds header', () => {
      // APIGatewayEventのモック
      const event = {
        headers: {
          'X-TTL-Seconds': '3600',
        },
      };
      const ttl = getTTLFromHeaders(event);
      expect(ttl).toBe(3600);
    });
    it('should extract TTL from lowercase x-ttl-seconds header', () => {
      // 小文字ヘッダーのテスト
      const event = {
        headers: {
          'x-ttl-seconds': '7200',
        },
      };
      const ttl = getTTLFromHeaders(event);
      expect(ttl).toBe(7200);
    });
    it('should return undefined when TTL header is not present', () => {
      // ヘッダーがない場合のテスト
      const event = {
        headers: {},
      };
      const ttl = getTTLFromHeaders(event);
      expect(ttl).toBeUndefined();
    });
    it('should return undefined when TTL header value is invalid', () => {
      // 無効なヘッダー値のテスト
      const event = {
        headers: {
          'X-TTL-Seconds': 'invalid',
        },
      };
      const ttl = getTTLFromHeaders(event);
      expect(ttl).toBeUndefined();
    });
    it('should return undefined when TTL header value is negative', () => {
      // 負の値のテスト
      const event = {
        headers: {
          'X-TTL-Seconds': '-3600',
        },
      };
      const ttl = getTTLFromHeaders(event);
      expect(ttl).toBeUndefined();
    });
    it('should extract TTL from query parameter when header is not present', () => {
      const event = {
        headers: {},
        queryStringParameters: {
          ttl: '3600',
        },
      };
      const ttl = getTTLFromHeaders(event);
      expect(ttl).toBe(3600);
    });
    it('should prioritize header over query parameter when both are present', () => {
      const event = {
        headers: {
          'X-TTL-Seconds': '7200',
        },
        queryStringParameters: {
          ttl: '3600',
        },
      };
      const ttl = getTTLFromHeaders(event);
      expect(ttl).toBe(7200);
    });
    it('should return undefined when both header and query parameter are invalid', () => {
      const event = {
        headers: {
          'X-TTL-Seconds': 'invalid',
        },
        queryStringParameters: {
          ttl: 'also-invalid',
        },
      };
      const ttl = getTTLFromHeaders(event);
      expect(ttl).toBeUndefined();
    });
  });
  describe('isItemExpired', () => {
    it('should return true when TTL is in the past', () => {
      // 過去のTTLをもつアイテム
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1時間前
      const item = {
        key: 'test-key',
        value: 'test-value',
        ttl: pastTime,
      };
      expect(isItemExpired(item)).toBe(true);
    });
    it('should return false when TTL is in the future', () => {
      // 未来のTTLをもつアイテム
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1時間後
      const item = {
        key: 'test-key',
        value: 'test-value',
        ttl: futureTime,
      };
      expect(isItemExpired(item)).toBe(false);
    });
    it('should return false when TTL is not defined', () => {
      // TTLが設定されていないアイテム
      const item = {
        key: 'test-key',
        value: 'test-value',
      };
      expect(isItemExpired(item)).toBe(false);
    });
  });
});
