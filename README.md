# Key-Value Store API

[![CI/CD Pipeline](https://github.com/kunikada/key-value-store-api/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/kunikada/key-value-store-api/actions/workflows/ci-cd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This project is a serverless REST API service that implements a Key-Value store using AWS services. The API allows users to perform CRUD operations on key-value pairs stored in DynamoDB.

## Features

- **Get Item**: Retrieve an item based on a specified key.
- **Put Item**: Add a new item to the store with a specified key and value.
- **Delete Item**: Remove an item from the store based on a specified key.
- **TTL Support**: Items can automatically expire after a specified time period.
- **Extract and Store Code**: Extract numeric codes from text messages and store them.

## Technologies Used

- Amazon API Gateway v2
- AWS Lambda
- Amazon DynamoDB
- SST v3 (Serverless Stack)
- TypeScript
- Vitest for testing

## Getting Started

### Prerequisites

To deploy and use this API, you need the following:

- Node.js 22.x or higher
- npm 10.x or higher
- AWS Account
- AWS CLI configured with appropriate credentials

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/kunikada/key-value-store-api.git
   cd key-value-store-api
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables (optional):

   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file to customize settings as needed.

### Development

To run the service locally:

```bash
npm run dev
```

This will start the SST development environment, which will deploy your app to a development stage in AWS.

### Deployment

To deploy this service to AWS:

1. Configure AWS credentials (if not already done):

   ```bash
   aws configure
   ```

2. Deploy with SST:

   ```bash
   # Standard deployment
   npm run deploy
   
   # Deploy to specific stage
   npm run deploy -- --stage prod
   ```

3. Retrieve the API key:
   After deployment, run the following command to get the API key:

   ```bash
   npm run console
   ```

   Use the displayed API key to authenticate your requests.

For detailed information about setting up the development environment, running tests, and other development activities, please refer to the [Contributing Guide](CONTRIBUTING.md).

## API Usage

### Authentication (API Key)

This API uses API Key authentication. The API Key is managed as an SST Secret and validated by a Lambda authorizer.

### Setting and Retrieving the API Key

1. Register the secret (only once):

   ```bash
   sst secret set ApiKey <your-api-key>
   ```

2. Deploy:

   ```bash
   npm run deploy
   ```

3. Example request using the API Key:

   ```bash
   curl -H "x-api-key: <your-api-key>" https://<api-url>/item/testKey
   ```

### Get Item

```
GET /item/{key}
```

Response: (Plain text)

```
your stored value
```

### Put Item

```
PUT /item/{key}
```

Request body:

```
<TEXT DATA>
```

HTTP Headers:

```
Content-Type: text/plain
X-TTL-Seconds: 3600  // Optional: automatically delete after specified seconds (1 hour = 3600 seconds)
```

URL Query Parameters (alternative to headers):

```
ttl=3600  // Optional: automatically delete after specified seconds
```

Note: When both header and query parameter are provided, the header takes precedence.

Response: (Plain text)

```
Item successfully saved
```

### Extract and Store Code

```
POST /extractCode/{key}
```

Request body:

```
<TEXT DATA CONTAINING CODE>
```

HTTP Headers:

```
Content-Type: text/plain
X-TTL-Seconds: 3600      // Optional: automatically delete after specified seconds
X-Digits: 4              // Optional: minimum number of digits in code (default: 4)
X-Character-Type: numeric // Optional: character type - 'numeric' or 'alphanumeric' (default: numeric)
characterType=numeric // Optional: character type - 'numeric' or 'alphanumeric'
```

Note: When both headers and query parameters are provided, headers take precedence.

This endpoint extracts codes from the provided text and stores the first match using the specified key.

Examples:

- With default settings (`X-Digits: 4` and `X-Character-Type: numeric`), sending "Your verification code is 123456" will extract and store "123456"
- With `X-Character-Type: alphanumeric`, sending "Your activation code is ABC123" will extract and store "ABC123"
- Using query parameters: `POST /extractCode/myKey?digits=5&characterType=alphanumeric`

Response: (Plain text)

```
Code extracted and stored successfully: 123456
```

### Delete Item

```
DELETE /item/{key}
```

Response: (Plain text)

```
Item successfully deleted
```

## Custom Domain Setup

You can set up a custom domain for your API using SST. This allows you to use a more friendly URL instead of the default API Gateway URL.

### Prerequisites

- A registered domain name
- A certificate in AWS Certificate Manager (ACM)
- Route 53 configured as your DNS provider (recommended)

### Installation Steps

1. Update your `stacks/ApiStack.ts` file to include domain configuration:

   ```typescript
   // Import DomainName from aws-cdk-lib
   import { aws_apigateway as apigateway } from 'aws-cdk-lib';

   // In your ApiStack function
   const api = new Api(stack, 'KeyValueStoreApi', {
     customDomain: {
       domainName: 'api.example.com',
       hostedZone: 'example.com',
       // or if you want to use an existing certificate:
       // certificate: certificateArn
     },
     // ... other API configuration
   });
   ```

2. Deploy your service:

   ```bash
   npm run deploy
   ```

After deployment, your API will be available at the custom domain (e.g., `https://api.example.com/item/{key}`).

### Regional vs Edge-Optimized Endpoints

- **Regional**: Faster access within the same AWS region
- **Edge-Optimized**: Better performance for geographically distributed clients

You can configure this in your SST stack:

```typescript
const api = new Api(stack, 'KeyValueStoreApi', {
  customDomain: {
    domainName: 'api.example.com',
    hostedZone: 'example.com',
    endpointType: apigateway.EndpointType.EDGE, // or REGIONAL
  },
  // ... other configuration
});
```

## Environment Variables

This service can be configured using the following environment variables (see `.env.example` for reference):

| Environment Variable | Description                    | Default Value      |
| -------------------- | ------------------------------ | ------------------ |
| `DEFAULT_TTL`        | Default TTL in seconds         | `86400` (24 hours) |
| `TABLE_NAME`         | DynamoDB table name            | `KeyValueStore`    |
| `AWS_REGION`         | AWS region for deployment      | `ap-northeast-1`   |
| `STAGE`              | Deployment stage               | `dev`              |

The `STAGE` environment variable is particularly important as it determines which environment (development, staging, production) your service will be deployed to. Each stage creates a completely separate set of resources in AWS.

## Deployment Stages

This service supports multiple deployment stages (environments) such as development, staging, and production. By default, the service will deploy to the `v1` stage.

### Switching Between Stages

You can deploy to a different stage by using the `--stage` option with the deploy command:

```bash
# Deploy to development stage
npm run deploy -- --stage dev

# Deploy to staging stage  
npm run deploy -- --stage staging

# Deploy to production stage
npm run deploy -- --stage prod

# Deploy with additional tags to development
npm run deploy -- --stage dev
```

### Setting a Default Stage

You can also set the default stage by:

1. Updating the stage in `sst.config.ts`:

   ```typescript
   export default $config({
     app(input) {
       return {
         name: 'key-value-store-api',
         removal: input?.stage === 'production' ? 'retain' : 'remove',
         home: 'aws',
         providers: {
           aws: {
             region: 'ap-northeast-1',
           },
         },
       };
     },
     // ...
   });
   ```

2. Setting an environment variable:

   ```bash
   export STAGE=dev
   npm run deploy
   ```

3. Adding it to your `.env` file:
   ```
   STAGE=dev
   ```

When multiple methods are used, the priority is as follows:

1. Command line option (`--stage`) has the highest priority
2. Environment variable set in the shell session
3. Value in the `.env` file
4. Default value in `sst.config.ts`

Each stage will create its own isolated resources in AWS, including separate API Gateway endpoints, Lambda functions, and DynamoDB tables. This isolation ensures that changes to one environment do not affect others.

### Updating a Deployment

To update an existing deployment after making code changes:

```bash
# Update the current deployment
npm run deploy

# Update a specific stage
npm run deploy -- --stage dev
```

For smaller changes that only affect a single Lambda function, you can use SST to deploy just that function for faster updates:

```bash
npx sst deploy --function <functionName>
```

### Removing a Deployment

To completely remove a deployed service from AWS:

```bash
# Remove the current deployment
npm run remove

# Remove a specific stage
npm run remove -- --stage dev
```

This will delete all AWS resources created by the deployment, including Lambda functions, API Gateway endpoints, DynamoDB tables, and IAM roles.

## TTL Feature Details

- `X-TTL-Seconds`: Time in seconds specified in HTTP header after which the item will be automatically deleted (optional)
- If not specified, the value from the environment variable `DEFAULT_TTL` will be used (default is 24 hours)

## Lambda Memory and Timeout Settings

By default, all Lambda functions in this project use the AWS default memory size of **128MB** and the default timeout of **3 seconds**. These settings are sufficient for typical key-value operations and can be customized in the stack configuration if needed.

If you require more memory or a longer timeout for specific use cases, you can add the `memorySize` and `timeout` properties to each function definition in `stacks/ApiStack.ts`.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our development process, how to set up your environment, and how to submit pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Security

If you discover a security vulnerability within this project, please use GitHub's private vulnerability reporting feature instead of creating a public issue. For more information, visit [GitHub's documentation on privately reporting a security vulnerability](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability).
