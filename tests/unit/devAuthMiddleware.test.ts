import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateApiKeyForDevelopment } from '@src/utils/devAuthMiddleware';
import { APIGatewayEvent } from 'aws-lambda';

// モックイベントのベース
const createMockEvent = (headers: Record<string, string> = {}): Partial<APIGatewayEvent> => ({
  headers,
  pathParameters: { key: 'test-key' },
  requestContext: {
    requestId: 'test-request-id',
    httpMethod: 'GET',
    path: '/item/test-key',
    stage: 'dev',
    accountId: '123456789012',
    apiId: 'test-api-id',
    identity: {
      sourceIp: '127.0.0.1',
      userAgent: 'test-user-agent',
    },
  } as any,
  httpMethod: 'GET',
  path: '/item/test-key',
  queryStringParameters: null,
  body: null,
});

describe('Development Authentication Middleware', () => {
  beforeEach(() => {
    // 各テストの前に環境変数をリセット
    vi.clearAllMocks();
    delete process.env.NODE_ENV;
    delete process.env.AWS_EXECUTION_ENV;
    delete process.env.DISABLE_AUTH_CHECK;
    delete process.env.VITEST;
  });

  it('本番環境では認証チェックをスキップする', () => {
    process.env.NODE_ENV = 'production';
    const event = createMockEvent({});

    const result = validateApiKeyForDevelopment(event as APIGatewayEvent);

    expect(result).toBeNull();
  });

  it('AWS環境では認証チェックをスキップする', () => {
    process.env.AWS_EXECUTION_ENV = 'AWS_Lambda_nodejs22.x';
    const event = createMockEvent({});

    const result = validateApiKeyForDevelopment(event as APIGatewayEvent);

    expect(result).toBeNull();
  });

  it('DISABLE_AUTH_CHECKが有効な場合は認証チェックをスキップする', () => {
    process.env.DISABLE_AUTH_CHECK = 'true';
    const event = createMockEvent({});

    const result = validateApiKeyForDevelopment(event as APIGatewayEvent);

    expect(result).toBeNull();
  });

  it('開発環境でAPIキーが存在しない場合は401を返す', () => {
    const event = createMockEvent({});

    const result = validateApiKeyForDevelopment(event as APIGatewayEvent);

    expect(result).toEqual({
      statusCode: 401,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'Missing API key. Please provide a valid x-api-key header.',
    });
  });

  it('開発環境で空のAPIキーが提供された場合は403を返す', () => {
    const event = createMockEvent({ 'x-api-key': '' });

    const result = validateApiKeyForDevelopment(event as APIGatewayEvent);

    expect(result).toEqual({
      statusCode: 403,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'Invalid API key. Please provide a valid x-api-key header.',
    });
  });

  it('開発環境で有効なAPIキーが提供された場合はnullを返す', () => {
    const event = createMockEvent({ 'x-api-key': 'valid-api-key' });

    const result = validateApiKeyForDevelopment(event as APIGatewayEvent);

    expect(result).toBeNull();
  });

  it('様々なヘッダー形式のAPIキーを受け入れる', () => {
    const headerVariations: Record<string, string>[] = [
      { 'x-api-key': 'valid-api-key' },
      { 'X-API-Key': 'valid-api-key' },
      { 'X-Api-Key': 'valid-api-key' },
      { 'X-API-KEY': 'valid-api-key' },
    ];

    headerVariations.forEach(headers => {
      const event = createMockEvent(headers);
      const result = validateApiKeyForDevelopment(event as APIGatewayEvent);
      expect(result).toBeNull();
    });
  });
});
