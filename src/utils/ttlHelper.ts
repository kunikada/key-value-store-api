import { KeyValueItem, TTLConfig } from '@src/types';
import { APIGatewayEvent } from 'aws-lambda';
import { logWarn, RequestInfo } from './logger';

// 環境変数からTTL設定を取得する
export const getTTLConfig = (): TTLConfig => {
  const ttlValue = process.env.DEFAULT_TTL ? parseInt(process.env.DEFAULT_TTL, 10) : 86400;
  return {
    enabled: true, // TTLは常に有効
    defaultTTL: isNaN(ttlValue) ? 86400 : ttlValue, // デフォルトは24時間（86400秒）
  };
};

/**
 * 現在時刻から指定された秒数後のUNIXタイムスタンプを計算する
 * 常に有効なTTLタイムスタンプを返す
 * @param seconds TTLの秒数
 * @returns UNIXタイムスタンプ（秒）
 */
export const calculateTTL = (seconds?: number): number => {
  const config = getTTLConfig();

  // TTLの秒数が指定されていない場合はデフォルト値を使用
  const ttl = seconds ?? config.defaultTTL ?? 86400; // デフォルトは24時間

  // 現在時刻 + TTL秒数
  return Math.floor(Date.now() / 1000) + ttl;
};

/**
 * HTTPリクエストヘッダーからTTL秒数を取得する
 * @param event API Gateway イベント
 * @param requestInfo リクエスト情報（ログ出力用）
 * @returns TTL秒数またはundefined
 */
export const getTTLFromHeaders = (
  event: APIGatewayEvent,
  requestInfo?: RequestInfo
): number | undefined => {
  // ヘッダーからTTLを取得（優先）
  const headers = event.headers || {};
  const ttlHeader = headers['X-TTL-Seconds'] || headers['x-ttl-seconds'] || headers['x-ttl'];

  if (ttlHeader) {
    const ttlSeconds = parseInt(ttlHeader, 10);
    if (!isNaN(ttlSeconds) && ttlSeconds > 0) {
      return ttlSeconds;
    } else {
      logWarn('Invalid TTL value in header', requestInfo, {
        ttlHeader,
        parsedValue: ttlSeconds,
        source: 'header',
      });
    }
  }

  // クエリパラメータからTTLを取得（ヘッダーがない場合）
  const ttlQuery = event.queryStringParameters?.ttl;
  if (ttlQuery) {
    const ttlSeconds = parseInt(ttlQuery, 10);
    if (!isNaN(ttlSeconds) && ttlSeconds > 0) {
      return ttlSeconds;
    } else {
      logWarn('Invalid TTL value in query parameter', requestInfo, {
        ttlQuery,
        parsedValue: ttlSeconds,
        source: 'query',
      });
    }
  }

  return undefined;
};

/**
 * アイテムが期限切れかどうかをチェックする
 * @param item チェックするアイテム
 * @returns 期限切れの場合はtrue、そうでない場合はfalse
 */
export const isItemExpired = (item: KeyValueItem): boolean => {
  // アイテムにTTLが設定されていない場合は期限切れではない
  if (!item.ttl) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  return item.ttl < now;
};
