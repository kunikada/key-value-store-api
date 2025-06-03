import { APIGatewayEvent, Context, Callback } from 'aws-lambda';
import { getRepository } from '@utils/repositoryFactory.js';

export const deleteItemHandler = async (
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
    // リポジトリを取得してアイテムを削除
    const repository = await getRepository();
    await repository.deleteItem(key);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'Item successfully deleted',
    };
  } catch (error) {
    console.error('Error in deleteItem handler:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'Error deleting item',
    };
  }
};
