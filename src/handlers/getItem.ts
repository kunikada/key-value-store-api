import { APIGatewayEvent, Context, Callback } from 'aws-lambda';
import { isItemExpired } from '@utils/ttlHelper';
import { getRepository } from '@utils/repositoryFactory';

export const getItemHandler = async (
  event: APIGatewayEvent,
  _context: Context,
  _callback: Callback
) => {
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
  try {
    // リポジトリを取得してアイテムを取得
    const repository = await getRepository();
    const item = await repository.getItem(key);

    if (!item) {
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
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'text/plain',
        },
        body: 'Item not found',
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: item.value,
    };
  } catch (error) {
    console.error('Error in getItem handler:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'Error retrieving item',
    };
  }
};
