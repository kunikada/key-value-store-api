import { APIGatewayEvent, Context, Callback } from 'aws-lambda';
import { getTTLFromHeaders, calculateTTL } from '@src/utils/ttlHelper';
import { getRepository } from '@src/utils/repositoryFactory';

export const putItemHandler = async (event: APIGatewayEvent, _context: Context, _callback: Callback) => {
  const key = event.pathParameters?.key;

  if (!key) {
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
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'text/plain',
        },
        body: 'Value is required in the request body',
      };
    }
  } catch {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'Invalid request body',
    };
  }

  try {
    // ヘッダーからTTL秒数を取得
    const ttlSeconds = getTTLFromHeaders(event);
    // 常に有効なTTLタイムスタンプを計算
    const ttlTimestamp = calculateTTL(ttlSeconds);

    // リポジトリを取得してアイテムを保存
    const repository = await getRepository();
    await repository.putItem(key, value, ttlTimestamp);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'Item successfully saved',
    };
  } catch (error) {
    console.error('Error in putItem handler:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'Error saving item',
    };
  }
};
