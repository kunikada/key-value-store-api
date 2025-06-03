export function ApiStack() {
  // DynamoDBテーブルの作成
  const table = new sst.aws.Dynamo('KeyValueStore', {
    fields: {
      key: 'string',
    },
    primaryIndex: { hashKey: 'key' },
    ttl: 'ttl',
  });

  // API Key用のSecretを作成
  const apiKeySecret = new sst.Secret("ApiKey");

  // API Gateway (sst.Api) の作成
  const api = new sst.Api(this, "KeyValueStoreApi", {
    cors: true,
    authorizers: {
      apiKeyAuth: {
        type: "lambda",
        function: "src/handlers/apiKeyAuthorizer.apiKeyAuthorizer",
        responseTypes: ["simple"],
      },
    },
    defaultAuthorizer: "apiKeyAuth",
    routes: {
      "GET /item/{key}": {
        function: {
          handler: "src/handlers/getItem.getItemHandler",
          environment: {
            TABLE_NAME: table.name,
            DEFAULT_TTL: process.env.DEFAULT_TTL || "86400",
            API_KEY: apiKeySecret.value,
          },
          permissions: [table, apiKeySecret],
        },
      },
      "PUT /item/{key}": {
        function: {
          handler: "src/handlers/putItem.putItemHandler",
          environment: {
            TABLE_NAME: table.name,
            DEFAULT_TTL: process.env.DEFAULT_TTL || "86400",
            API_KEY: apiKeySecret.value,
          },
          permissions: [table, apiKeySecret],
        },
      },
      "DELETE /item/{key}": {
        function: {
          handler: "src/handlers/deleteItem.deleteItemHandler",
          environment: {
            TABLE_NAME: table.name,
            DEFAULT_TTL: process.env.DEFAULT_TTL || "86400",
            API_KEY: apiKeySecret.value,
          },
          permissions: [table, apiKeySecret],
        },
      },
      "POST /extractCode/{key}": {
        function: {
          handler: "src/handlers/extractAndStoreCode.extractAndStoreCodeHandler",
          environment: {
            TABLE_NAME: table.name,
            DEFAULT_TTL: process.env.DEFAULT_TTL || "86400",
            API_KEY: apiKeySecret.value,
          },
          permissions: [table, apiKeySecret],
        },
      },
    },
  });

  return {
    api: api.url,
    table: table.name,
  };
}
