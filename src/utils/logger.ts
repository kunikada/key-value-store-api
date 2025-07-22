import { APIGatewayEvent } from 'aws-lambda';

// ログレベル定義
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

// ログレベルの重要度（数値が小さいほど重要）
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.ERROR]: 0,
  [LogLevel.WARN]: 1,
  [LogLevel.INFO]: 2,
  [LogLevel.DEBUG]: 3,
};

// 環境変数から現在のログレベルを取得（デフォルトはINFO）
const getCurrentLogLevel = (): LogLevel => {
  const envLogLevel = process.env.LOG_LEVEL?.toUpperCase();
  if (envLogLevel && Object.values(LogLevel).includes(envLogLevel as LogLevel)) {
    return envLogLevel as LogLevel;
  }
  // 本番環境では警告レベル以上のみ、開発環境では情報レベル以上
  return process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.INFO;
};

// ログレベルに基づいてログを出力すべきか判定
const shouldLog = (level: LogLevel): boolean => {
  const currentLevel = getCurrentLogLevel();
  return LOG_LEVEL_PRIORITY[level] <= LOG_LEVEL_PRIORITY[currentLevel];
};

// リクエスト情報の型定義
export interface RequestInfo {
  requestId: string;
  httpMethod: string;
  path: string;
  pathParameters: Record<string, string | undefined> | null;
  queryStringParameters: Record<string, string | undefined> | null;
  headers: Record<string, string | undefined>;
  sourceIp?: string;
  userAgent?: string | null;
}

// ログのコンテキスト情報の型定義
export type LogContext = Record<string, unknown>;

// リクエスト情報の抽出
export const extractRequestInfo = (event: APIGatewayEvent): RequestInfo => {
  const headers = event.headers || {};

  return {
    requestId: event.requestContext?.requestId || 'unknown',
    httpMethod: event.httpMethod,
    path: event.path,
    pathParameters: event.pathParameters,
    queryStringParameters: event.queryStringParameters,
    headers: {
      // セキュリティ上重要でないヘッダーのみログに記録
      // ES2022のObject.hasOwn()でより安全なプロパティチェック
      'content-type': Object.hasOwn(headers, 'Content-Type')
        ? headers['Content-Type']
        : headers['content-type'],
      'user-agent': Object.hasOwn(headers, 'User-Agent')
        ? headers['User-Agent']
        : headers['user-agent'],
      'x-ttl-seconds': Object.hasOwn(headers, 'X-TTL-Seconds')
        ? headers['X-TTL-Seconds']
        : headers['x-ttl-seconds'],
      'x-digits': Object.hasOwn(headers, 'X-Digits') ? headers['X-Digits'] : headers['x-digits'],
      'x-character-type': Object.hasOwn(headers, 'X-Character-Type')
        ? headers['X-Character-Type']
        : headers['x-character-type'],
    },
    sourceIp: event.requestContext?.identity?.sourceIp,
    userAgent: event.requestContext?.identity?.userAgent,
  };
};

// 構造化ログの出力
export const log = (level: LogLevel, message: string, additionalInfo?: LogContext) => {
  // ログレベルチェック：設定されたレベル以下の重要度のログは出力しない
  if (!shouldLog(level)) {
    return;
  }

  // CloudWatchが自動的にタイムスタンプを付与するため、タイムスタンプは不要
  const logData = {
    ...additionalInfo,
  };

  // ログレベルに応じてコンソールメソッドを使い分け
  const hasLogData = Object.keys(logData).length > 0;
  const logArgs = hasLogData ? [message, JSON.stringify(logData)] : [message];

  switch (level) {
    case LogLevel.ERROR:
      console.error(...logArgs);
      break;
    case LogLevel.WARN:
      console.warn(...logArgs);
      break;
    case LogLevel.INFO:
      console.info(...logArgs);
      break;
    case LogLevel.DEBUG:
      console.debug(...logArgs);
      break;
    default:
      console.log(...logArgs);
      break;
  }
};

// エラーログの便利メソッド
export const logError = (
  message: string,
  error: Error | unknown,
  requestInfo?: RequestInfo,
  additionalContext?: LogContext
) => {
  const errorInfo =
    error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
          // ES2022のError causeを活用
          cause: error.cause ? String(error.cause) : undefined,
        }
      : { error: String(error) };

  log(LogLevel.ERROR, message, {
    error: errorInfo,
    request: requestInfo,
    ...additionalContext,
  });
};

// 情報ログの便利メソッド
export const logInfo = (
  message: string,
  requestInfo?: RequestInfo,
  additionalContext?: LogContext
) => {
  log(LogLevel.INFO, message, {
    request: requestInfo,
    ...additionalContext,
  });
};

// 警告ログの便利メソッド
export const logWarn = (
  message: string,
  requestInfo?: RequestInfo,
  additionalContext?: LogContext
) => {
  log(LogLevel.WARN, message, {
    request: requestInfo,
    ...additionalContext,
  });
};

// デバッグログの便利メソッド
export const logDebug = (
  message: string,
  requestInfo?: RequestInfo,
  additionalContext?: LogContext
) => {
  log(LogLevel.DEBUG, message, {
    request: requestInfo,
    ...additionalContext,
  });
};
