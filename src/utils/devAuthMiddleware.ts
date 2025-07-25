import { APIGatewayEvent } from 'aws-lambda';
import { logAuthenticationError } from './authHelper';
import { extractRequestInfo } from './logger';

/**
 * 開発環境用のシンプルなAPI認証ミドルウェア
 * 本番環境ではAPI Gatewayが自動的に認証を行うため、この関数は実行されない
 * @param event API Gateway イベント
 * @returns 認証成功時はnull、失敗時はエラーレスポンス
 */
export const validateApiKeyForDevelopment = (
  event: APIGatewayEvent
): { statusCode: number; headers: Record<string, string>; body: string } | null => {
  // 本番環境やAWS環境では認証はAPI Gatewayが処理するため、この関数はスキップ
  if (process.env.NODE_ENV === 'production' || process.env.AWS_EXECUTION_ENV) {
    return null;
  }

  // 開発環境かつDISABLE_AUTH_CHECKが設定されている場合は認証をスキップ
  if (process.env.DISABLE_AUTH_CHECK === 'true') {
    return null;
  }

  // テスト環境では認証をスキップ
  if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') {
    return null;
  }

  const requestInfo = extractRequestInfo(event);
  const headers = event.headers || {};

  // API キーの存在をチェック
  const apiKeyHeaders = ['x-api-key', 'X-API-Key', 'X-Api-Key', 'X-API-KEY'];
  const apiKey = apiKeyHeaders.find(header => header in headers);

  if (!apiKey) {
    logAuthenticationError(401, requestInfo, {
      message: 'Missing API key in request headers',
      availableHeaders: Object.keys(headers),
    });

    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'Missing API key. Please provide a valid x-api-key header.',
    };
  }

  const apiKeyValue = apiKey ? headers[apiKey] : undefined;

  // 開発環境用の簡単な認証チェック（空の場合のみエラー）
  if (!apiKeyValue || apiKeyValue.trim() === '') {
    logAuthenticationError(403, requestInfo, {
      message: 'Empty API key provided',
      headerName: apiKey,
    });

    return {
      statusCode: 403,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'Invalid API key. Please provide a valid x-api-key header.',
    };
  }

  // 開発環境では有効なAPIキーとして扱う
  return null;
};
