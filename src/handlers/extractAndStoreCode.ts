import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getTTLFromHeaders, calculateTTL } from '@src/utils/ttlHelper';
import { getRepository } from '@src/utils/repositoryFactory';

// 半角数字のコードを抽出する関数
const extractNumericCode = (text: string): string | null => {
  // 半角数字のみの連続した文字列を検索（最低4桁以上を想定）
  const matches = text.match(/\b\d{4,}\b/g);

  if (!matches || matches.length === 0) {
    return null;
  }

  // 最初に見つかったコードを返す
  return matches[0];
};

export const extractAndStoreCodeHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // リクエストボディからテキストを取得
    const messageText = event.body;

    if (!messageText) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'text/plain',
        },
        body: 'Request body cannot be empty',
      };
    }

    // テキストから半角数字コードを抽出
    const extractedCode = extractNumericCode(messageText);

    if (!extractedCode) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'text/plain',
        },
        body: 'No numeric code found in the text',
      };
    }

    // URLパスからキーを取得
    const key = event.pathParameters?.key;

    if (!key) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'text/plain',
        },
        body: 'Key must be specified in the path',
      };
    }

    // 共通の関数を使用してTTLを取得・計算
    const ttlSeconds = getTTLFromHeaders(event);
    // 常に有効なTTLタイムスタンプを計算
    const ttlTimestamp = calculateTTL(ttlSeconds);

    // リポジトリを取得し、アイテムを保存
    const repository = await getRepository();
    await repository.putItem(key, extractedCode, ttlTimestamp);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: `Code extracted and stored successfully: ${extractedCode}`,
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'An error occurred while processing your request',
    };
  }
};
