import { APIGatewayEvent, Context, Callback } from 'aws-lambda';
import { isItemExpired } from '@src/utils/ttlHelper';
import { getRepository } from '@src/utils/repositoryFactory';
import { extractRequestInfo, logError, logInfo, logWarn } from '@src/utils/logger';
import { validateApiKeyForDevelopment } from '@src/utils/devAuthMiddleware';

export const getItemHandler = async (
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
  try {
    // リポジトリを取得してアイテムを取得
    const repository = await getRepository();

    const item = await repository.getItem(key);

    if (!item) {
      logWarn('Item not found in repository', requestInfo, { key });
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'text/plain',
        },
        body: 'Item not found',
      };
    }

    // TTLヘルパーを使用して期限切れかどうかをチェック
    if (isItemExpired(item)) {
      logWarn('Item found but expired', requestInfo, {
        key,
        itemTtl: item.ttl,
        currentTime: Math.floor(Date.now() / 1000),
      });
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'text/plain',
        },
        body: 'Item not found',
      };
    }

    // 正常処理完了時はINFOレベルで簡潔にログ出力（本番環境では通常非表示）
    logInfo('Item successfully retrieved', requestInfo, {
      key,
      valueLength: item.value?.length || 0,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: item.value,
    };
  } catch (error) {
    // エラー時は詳細な情報をログ出力
    logError('Error in getItem handler', error, requestInfo, {
      key,
      pathParameters: event.pathParameters,
    });
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'Error retrieving item',
    };
  }
};
