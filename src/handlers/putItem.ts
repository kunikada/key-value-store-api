import { APIGatewayEvent, Context, Callback } from 'aws-lambda';
import { getTTLFromHeaders, calculateTTL } from '@src/utils/ttlHelper';
import { getRepository } from '@src/utils/repositoryFactory';
import { extractRequestInfo, logError, logInfo, logWarn } from '@src/utils/logger';
import { validateApiKeyForDevelopment } from '@src/utils/devAuthMiddleware';

export const putItemHandler = async (
  event: APIGatewayEvent,
  _context: Context,
  _callback: Callback
) => {
  // 開発環境でのAPI認証チェック（本番環境ではAPI Gatewayが自動で認証）
  const authError = validateApiKeyForDevelopment(event);
  if (authError) {
    return authError;
  }

  const requestInfo = extractRequestInfo(event);

  const key = event.pathParameters?.key;

  if (!key) {
    logWarn('Bad request: Missing key parameter', requestInfo);
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'Key is required',
    };
  }

  let value: string;
  try {
    // リクエストボディをそのまま文字列として使用
    value = event.body || '';

    if (!value) {
      logWarn('Bad request: Missing value in request body', requestInfo, { key });
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'text/plain',
        },
        body: 'Value is required in the request body',
      };
    }
  } catch {
    logWarn('Bad request: Invalid request body', requestInfo, { key });
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'Invalid request body',
    };
  }

  try {
    // ヘッダーからTTL秒数を取得（ログ出力付き）
    const ttlSeconds = getTTLFromHeaders(event, requestInfo);
    // 常に有効なTTLタイムスタンプを計算
    const ttlTimestamp = calculateTTL(ttlSeconds);

    // リポジトリを取得してアイテムを保存
    const repository = await getRepository();
    await repository.putItem(key, value, ttlTimestamp);

    // 正常処理完了時はINFOレベルで簡潔にログ出力（本番環境では通常非表示）
    logInfo('Item successfully saved', requestInfo, {
      key,
      valueLength: value.length,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'Item successfully saved',
    };
  } catch (error) {
    // エラー時は詳細な情報をログ出力
    logError('Error in putItem handler', error, requestInfo, {
      key,
      valueLength: value?.length || 0,
      body: event.body?.substring(0, 500), // エラー時にリクエストボディの一部も含める
      pathParameters: event.pathParameters,
    });
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'Error saving item',
    };
  }
};
