import { describe, it, expect, beforeEach } from 'vitest';
import { extractAndStoreCodeHandler } from '../../src/handlers/extractAndStoreCode';
import { KeyValueRepository } from '../../src/utils/dynamoDBClient';
import { KeyValueItem } from '../../src/types';
import { setRepository } from '../../src/utils/repositoryFactory';

// テスト用のモックリポジトリクラス
class MockRepository implements KeyValueRepository {
  private items: Map<string, KeyValueItem> = new Map();
  private shouldThrowError: boolean = false;
  public lastSavedItem: KeyValueItem | null = null;

  constructor() {
    this.reset();
  }

  reset() {
    this.items.clear();
    this.shouldThrowError = false;
    this.lastSavedItem = null;
  }

  setShouldThrowError(shouldThrow: boolean) {
    this.shouldThrowError = shouldThrow;
  }

  async getItem(key: string): Promise<KeyValueItem | null> {
    if (this.shouldThrowError) {
      throw new Error('Simulated database error');
    }
    return this.items.get(key) || null;
  }

  async putItem(key: string, value: string, ttl: number): Promise<KeyValueItem> {
    if (this.shouldThrowError) {
      throw new Error('Simulated database error');
    }

    // エラーをシミュレートするキー
    if (key === 'error-key') {
      throw new Error('Database connection error');
    }

    const item = { key, value, ttl };
    this.items.set(key, item);
    this.lastSavedItem = item;
    return item;
  }

  async deleteItem(key: string): Promise<void> {
    if (this.shouldThrowError) {
      throw new Error('Simulated database error');
    }
    this.items.delete(key);
  }
}

describe('extractAndStoreCode handler', () => {
  const mockRepository = new MockRepository();

  beforeEach(() => {
    // 各テスト前にモックリポジトリをリセットして、リポジトリファクトリに設定
    mockRepository.reset();
    setRepository(mockRepository);
  });

  it('should extract and store numeric code from text and return plain text message', async () => {
    const event = {
      pathParameters: {
        key: 'test-key',
      },
      body: 'Your verification code is 123456. Please enter this code to continue.',
      headers: {
        'x-ttl': '3600', // 1時間のTTL
        'x-digits': '6', // 6桁のコードに指定
      },
    };

    // ハンドラーを呼び出してレスポンスを検証
    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('Code extracted and stored successfully: 123456');

    // モックリポジトリに正しく保存されたか確認
    expect(mockRepository.lastSavedItem).not.toBeNull();
    expect(mockRepository.lastSavedItem?.key).toBe('test-key');
    expect(mockRepository.lastSavedItem?.value).toBe('123456');
    // TTLは現在時刻に基づいて計算されるため、正確な値ではなく存在するかだけ確認
    expect(mockRepository.lastSavedItem?.ttl).toBeDefined();
  });

  it('should return 400 with plain text message when no numeric code is found in the text', async () => {
    const event = {
      pathParameters: {
        key: 'test-key',
      },
      body: 'This text contains no numeric code.',
    };

    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(400);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe(
      'No code matching the criteria found in the text (digits: 4, characterType: numeric)'
    );
  });

  it('should return 400 with plain text message when request body is empty', async () => {
    const event = {
      pathParameters: {
        key: 'test-key',
      },
      body: null,
    };

    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(400);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('Request body cannot be empty');
  });

  it('should return 400 with plain text message when key is not provided', async () => {
    const event = {
      pathParameters: null,
      body: 'Your verification code is 123456.',
    };

    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(400);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('Key must be specified in the path');
  });

  it('should extract only the numeric code with exact digits', async () => {
    const event = {
      pathParameters: {
        key: 'test-key',
      },
      body: 'Your verification code is 987654. The order number is 123. Please enter the verification code.',
      headers: {
        'x-digits': '6',
      },
    };

    // ハンドラーを呼び出してレスポンスを検証
    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('Code extracted and stored successfully: 987654');

    // モックリポジトリに正しく保存されたか確認
    expect(mockRepository.lastSavedItem).not.toBeNull();
    expect(mockRepository.lastSavedItem?.key).toBe('test-key');
    expect(mockRepository.lastSavedItem?.value).toBe('987654');
  });

  it('should return 500 with plain text message when there is an error saving the item', async () => {
    // データベースエラーをシミュレート
    mockRepository.setShouldThrowError(true);

    const event = {
      pathParameters: {
        key: 'test-key',
      },
      body: 'Your verification code is 123456. Please enter this code to continue.',
      headers: {
        'x-digits': '6',
      },
    };

    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(500);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('An error occurred while processing your request');
  });

  it('should extract alphanumeric code when characterType is alphanumeric', async () => {
    const event = {
      pathParameters: {
        key: 'test-key',
      },
      body: 'Your activation code is ABC123. Please enter this code to continue.',
      headers: {
        'x-character-type': 'alphanumeric',
        'x-digits': '6',
      },
    };

    // ハンドラーを呼び出してレスポンスを検証
    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('Code extracted and stored successfully: ABC123');

    // モックリポジトリに正しく保存されたか確認
    expect(mockRepository.lastSavedItem).not.toBeNull();
    expect(mockRepository.lastSavedItem?.key).toBe('test-key');
    expect(mockRepository.lastSavedItem?.value).toBe('ABC123');
  });

  it('should extract code based on digits parameter', async () => {
    const event = {
      pathParameters: {
        key: 'test-key',
      },
      body: 'Your codes are 123, 1234, and 12345.',
      headers: {
        'x-digits': '4',
      },
    };

    // ハンドラーを呼び出してレスポンスを検証
    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('Code extracted and stored successfully: 1234');

    // モックリポジトリに正しく保存されたか確認
    expect(mockRepository.lastSavedItem).not.toBeNull();
    expect(mockRepository.lastSavedItem?.key).toBe('test-key');
    expect(mockRepository.lastSavedItem?.value).toBe('1234');
  });

  it('should return 400 when invalid character type is provided', async () => {
    const event = {
      pathParameters: {
        key: 'test-key',
      },
      body: 'Your activation code is ABC123.',
      headers: {
        'x-character-type': 'invalid',
      },
    };

    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(400);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe("Invalid character type. Must be one of: 'numeric', 'alphanumeric'");
  });

  it('should extract code using query parameters', async () => {
    const event = {
      pathParameters: {
        key: 'test-key',
      },
      queryStringParameters: {
        digits: '6',
        characterType: 'alphanumeric',
      },
      body: 'Your activation code is XYZ123. and your PIN is 567890.',
    };

    // ハンドラーを呼び出してレスポンスを検証
    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('Code extracted and stored successfully: XYZ123');

    // モックリポジトリに正しく保存されたか確認
    expect(mockRepository.lastSavedItem).not.toBeNull();
    expect(mockRepository.lastSavedItem?.key).toBe('test-key');
    expect(mockRepository.lastSavedItem?.value).toBe('XYZ123');
  });

  it('should prioritize headers over query parameters when both are provided', async () => {
    const event = {
      pathParameters: {
        key: 'test-key',
      },
      queryStringParameters: {
        digits: '5',
        characterType: 'alphanumeric',
      },
      headers: {
        'x-digits': '4',
        'x-character-type': 'numeric',
      },
      body: 'Your code is 1234 and your alphanumeric code is ABC12.',
    };

    // ハンドラーを呼び出してレスポンスを検証
    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('Code extracted and stored successfully: 1234');

    // モックリポジトリに正しく保存されたか確認
    expect(mockRepository.lastSavedItem).not.toBeNull();
    expect(mockRepository.lastSavedItem?.key).toBe('test-key');
    expect(mockRepository.lastSavedItem?.value).toBe('1234');
  });

  it('should extract and store code from JSON request body', async () => {
    const event = {
      pathParameters: {
        key: 'test-key',
      },
      headers: {
        'content-type': 'application/json',
        'x-digits': '6',
      },
      body: JSON.stringify({
        text: 'Your verification code is 123456. Please enter this code to continue.',
      }),
    };

    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('Code extracted and stored successfully: 123456');

    // モックリポジトリに正しく保存されたか確認
    expect(mockRepository.lastSavedItem).not.toBeNull();
    expect(mockRepository.lastSavedItem?.key).toBe('test-key');
    expect(mockRepository.lastSavedItem?.value).toBe('123456');
  });

  it('should return 400 when JSON request body has no text field', async () => {
    const event = {
      pathParameters: {
        key: 'test-key',
      },
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        code: '123456',
      }),
    };

    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(400);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('The "text" field is required in the request body');
  });

  it('should return 400 when JSON request body has empty text field', async () => {
    const event = {
      pathParameters: {
        key: 'test-key',
      },
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        text: '',
      }),
    };

    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(400);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('The "text" field is required in the request body');
  });

  it('should return 400 when JSON request body is invalid', async () => {
    const event = {
      pathParameters: {
        key: 'test-key',
      },
      headers: {
        'content-type': 'application/json',
      },
      body: 'invalid json {',
    };

    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(400);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('Invalid JSON format in request body');
  });

  it('should extract alphanumeric code from JSON request with headers parameters', async () => {
    const event = {
      pathParameters: {
        key: 'test-key',
      },
      headers: {
        'content-type': 'application/json',
        'x-character-type': 'alphanumeric',
        'x-digits': '6',
      },
      body: JSON.stringify({
        text: 'Your activation code is ABC123. Please enter this code to continue.',
      }),
    };

    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('Code extracted and stored successfully: ABC123');

    expect(mockRepository.lastSavedItem).not.toBeNull();
    expect(mockRepository.lastSavedItem?.key).toBe('test-key');
    expect(mockRepository.lastSavedItem?.value).toBe('ABC123');
  });

  it('should extract code from JSON request using query parameters', async () => {
    const event = {
      pathParameters: {
        key: 'test-key',
      },
      queryStringParameters: {
        digits: '6',
        characterType: 'numeric',
      },
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Your verification code is 987654. Please enter this code to continue.',
      }),
    };

    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('Code extracted and stored successfully: 987654');

    expect(mockRepository.lastSavedItem).not.toBeNull();
    expect(mockRepository.lastSavedItem?.key).toBe('test-key');
    expect(mockRepository.lastSavedItem?.value).toBe('987654');
  });

  it('should handle Content-Type header with charset', async () => {
    const event = {
      pathParameters: {
        key: 'test-key',
      },
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'x-digits': '6',
      },
      body: JSON.stringify({
        text: 'Your verification code is 456789. Please enter this code to continue.',
      }),
    };

    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('Code extracted and stored successfully: 456789');

    expect(mockRepository.lastSavedItem).not.toBeNull();
    expect(mockRepository.lastSavedItem?.key).toBe('test-key');
    expect(mockRepository.lastSavedItem?.value).toBe('456789');
  });

  it('should extract and store code from URL-encoded request body', async () => {
    const event = {
      pathParameters: {
        key: 'test-key',
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'x-digits': '6',
      },
      body: 'Your%20verification%20code%20is%20123456.%20Please%20enter%20this%20code%20to%20continue.',
    };

    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('Code extracted and stored successfully: 123456');

    // モックリポジトリに正しく保存されたか確認
    expect(mockRepository.lastSavedItem).not.toBeNull();
    expect(mockRepository.lastSavedItem?.key).toBe('test-key');
    expect(mockRepository.lastSavedItem?.value).toBe('123456');
  });

  it('should extract alphanumeric code from URL-encoded request body', async () => {
    const event = {
      pathParameters: {
        key: 'test-key',
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'x-character-type': 'alphanumeric',
        'x-digits': '6',
      },
      body: 'Your%20activation%20code%20is%20ABC123.%20Please%20enter%20this%20code.',
    };

    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('Code extracted and stored successfully: ABC123');

    expect(mockRepository.lastSavedItem).not.toBeNull();
    expect(mockRepository.lastSavedItem?.key).toBe('test-key');
    expect(mockRepository.lastSavedItem?.value).toBe('ABC123');
  });

  it('should handle URL-encoded request with special characters', async () => {
    const event = {
      pathParameters: {
        key: 'test-key',
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'x-digits': '4',
      },
      body: 'Code%3A%201234%20%28valid%20until%202025%29',
    };

    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('Code extracted and stored successfully: 1234');

    expect(mockRepository.lastSavedItem).not.toBeNull();
    expect(mockRepository.lastSavedItem?.key).toBe('test-key');
    expect(mockRepository.lastSavedItem?.value).toBe('1234');
  });

  it('should return 400 when URL-encoded request body is empty', async () => {
    const event = {
      pathParameters: {
        key: 'test-key',
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: null,
    };

    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(400);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('Request body cannot be empty');
  });

  it('should return 400 when no code found in URL-encoded request', async () => {
    const event = {
      pathParameters: {
        key: 'test-key',
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: 'This%20text%20contains%20no%20code',
    };

    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(400);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe(
      'No code matching the criteria found in the text (digits: 4, characterType: numeric)'
    );
  });

  it('should extract code from URL-encoded request using query parameters', async () => {
    const event = {
      pathParameters: {
        key: 'test-key',
      },
      queryStringParameters: {
        digits: '5',
        characterType: 'alphanumeric',
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: 'Your%20code%20is%20XYZ99%20and%20PIN%20is%201234',
    };

    const response = await extractAndStoreCodeHandler(event as any);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual({ 'Content-Type': 'text/plain' });
    expect(response.body).toBe('Code extracted and stored successfully: XYZ99');

    expect(mockRepository.lastSavedItem).not.toBeNull();
    expect(mockRepository.lastSavedItem?.key).toBe('test-key');
    expect(mockRepository.lastSavedItem?.value).toBe('XYZ99');
  });
});
