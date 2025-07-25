import { APIGatewayEvent, Context, Callback } from 'aws-lambda';
import { getRepository } from '@src/utils/repositoryFactory';
import { extractRequestInfo, logError, logInfo, logWarn } from '@src/utils/logger';
import { validateApiKeyForDevelopment } from '@src/utils/devAuthMiddleware';

export const deleteItemHandler = async (
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
    // リポジトリを取得してアイテムを削除
    const repository = await getRepository();
    await repository.deleteItem(key);

    // 正常処理完了時はINFOレベルで簡潔にログ出力（本番環境では通常非表示）
    logInfo('Item successfully deleted', requestInfo, { key });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'Item successfully deleted',
    };
  } catch (error) {
    // エラー時は詳細な情報をログ出力
    logError('Error in deleteItem handler', error, requestInfo, {
      key,
      pathParameters: event.pathParameters,
    });
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'Error deleting item',
    };
  }
};
