import { APIGatewayEvent } from 'aws-lambda';
import { logWarn, logDebug, RequestInfo } from './logger';

/**
 * API キー認証の情報をログ出力するためのヘルパー関数
 * @param event API Gateway イベント
 * @param requestInfo リクエスト情報
 */
export const logAuthenticationInfo = (event: APIGatewayEvent, requestInfo: RequestInfo): void => {
  const headers = event.headers || {};

  // API キーの存在チェック（様々な形式をサポート）
  const apiKeyHeaders = ['x-api-key', 'X-API-Key', 'X-Api-Key', 'X-API-KEY'];

  const providedApiKey = apiKeyHeaders.find(header => header in headers);

  if (providedApiKey) {
    logDebug('API key provided in request', requestInfo, {
      headerName: providedApiKey,
      hasApiKey: true,
    });
  } else {
    logWarn('No API key found in request headers', requestInfo, {
      availableHeaders: Object.keys(headers),
      expectedHeaders: apiKeyHeaders,
    });
  }

  // リクエストソースの情報もログ出力
  logDebug('Request source information', requestInfo, {
    sourceIp: requestInfo.sourceIp,
    userAgent: requestInfo.userAgent,
    stage: event.requestContext?.stage,
    accountId: event.requestContext?.accountId,
  });
};

/**
 * 認証エラー時の詳細ログ出力
 * @param statusCode HTTPステータスコード
 * @param requestInfo リクエスト情報
 * @param additionalInfo 追加情報
 */
export const logAuthenticationError = (
  statusCode: number,
  requestInfo: RequestInfo,
  additionalInfo?: Record<string, unknown>
): void => {
  const errorType = statusCode === 401 ? 'Missing API Key' : 'Invalid API Key';

  logWarn(`Authentication failed: ${errorType}`, requestInfo, {
    statusCode,
    errorType,
    ...additionalInfo,
  });
};
