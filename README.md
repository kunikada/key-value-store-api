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

- Amazon API Gateway
- AWS Lambda
- Amazon DynamoDB
- Serverless Framework
- TypeScript
- Vitest for testing

## Getting Started

### Prerequisites

To deploy and use this API, you need the following:

- Node.js 22.x or higher
- npm 10.x or higher
- AWS Account
- AWS CLI configured with appropriate credentials
- Serverless Framework

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

### Deployment

To deploy this service to AWS:

1. Configure AWS credentials for Serverless Framework (if not already done):

   ```bash
   aws configure
   ```

2. Deploy the service:

   ```bash
   npm run deploy
   ```

3. Retrieve the API key:
   After deployment, run the following command to get the API key:

   ```bash
   npx serverless info
   ```

   Use the displayed API key to authenticate your requests.

For detailed information about setting up the development environment, running tests, and other development activities, please refer to the [Contributing Guide](CONTRIBUTING.md).

## API Usage

### Authentication

All API endpoints require authentication using an API key. Include the API key in your HTTP requests using the `x-api-key` header:

```
x-api-key: your-api-key-here
```

You can retrieve your API key after deployment by running:

```bash
npx serverless info
```

**Authentication Error Responses:**

Missing API key (401):

```
Missing API key. Please provide a valid x-api-key header.
```

Invalid/Empty API key (403):

```
Invalid API key. Please provide a valid x-api-key header.
```

### Get Item

```
GET /item/{key}
```

**Response Examples:**

Success (200):

```
your stored value
```

Item not found or expired (404):

```
Item not found
```

Bad request - missing key (400):

```
Key is required
```

Server error (500):

```
Error retrieving item
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

**Response Examples:**

Success (200):

```
Item successfully saved
```

Bad request - missing key (400):

```
Key is required
```

Bad request - empty value (400):

```
Value is required in the request body
```

Bad request - invalid body (400):

```
Invalid request body
```

Server error (500):

```
Error saving item
```

### Extract and Store Code

```
POST /extractCode/{key}
```

#### Request Formats

**Format 1: Plain Text (text/plain)**

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
```

**Format 2: JSON (application/json)**

Request body:

```json
{
  "text": "TEXT DATA CONTAINING CODE"
}
```

HTTP Headers:

```
Content-Type: application/json
X-TTL-Seconds: 3600      // Optional: automatically delete after specified seconds
X-Digits: 4              // Optional: minimum number of digits in code (default: 4)
X-Character-Type: numeric // Optional: character type - 'numeric' or 'alphanumeric' (default: numeric)
```

**Format 3: URL Encoded (application/x-www-form-urlencoded)**

Request body:

```
<URL ENCODED TEXT DATA CONTAINING CODE>
```

HTTP Headers:

```
Content-Type: application/x-www-form-urlencoded
X-TTL-Seconds: 3600      // Optional: automatically delete after specified seconds
X-Digits: 4              // Optional: minimum number of digits in code (default: 4)
X-Character-Type: numeric // Optional: character type - 'numeric' or 'alphanumeric' (default: numeric)
```

Note: The body will be automatically URL-decoded and then processed as plain text.

#### Query Parameters (alternative to headers)

Both request formats support query parameters:

```
?digits=5&characterType=alphanumeric&ttl=3600
```

Note: When both headers and query parameters are provided, headers take precedence.

This endpoint extracts codes from the provided text and stores the first match using the specified key.

Examples:

- With default settings (`X-Digits: 4` and `X-Character-Type: numeric`), sending "Your verification code is 123456" will extract and store "123456"
- With `X-Character-Type: alphanumeric`, sending "Your activation code is ABC123" will extract and store "ABC123"
- Using query parameters: `POST /extractCode/myKey?digits=5&characterType=alphanumeric`
- Using JSON format: `POST /extractCode/myKey` with body `{"text":"Your verification code is 123456"}`
- Using URL-encoded format: `POST /extractCode/myKey` with `Content-Type: application/x-www-form-urlencoded` and body `Your%20verification%20code%20is%20123456`

**Response Examples:**

Success (200):

```
Code extracted and stored successfully: 123456
```

Bad request - missing key (400):

```
Key must be specified in the path
```

Bad request - empty body (400):

```
Request body cannot be empty
```

Bad request - invalid character type (400):

```
Invalid character type. Must be one of: 'numeric', 'alphanumeric'
```

Bad request - no code found (400):

```
No code matching the criteria found in the text (digits: 4, characterType: numeric)
```

Server error (500):

```
An error occurred while processing your request
```

### Delete Item

```
DELETE /item/{key}
```

**Response Examples:**

Success (200):

```
Item successfully deleted
```

Bad request - missing key (400):

```
Key is required
```

Server error (500):

```
Error deleting item
```

## Custom Domain Setup

You can set up a custom domain for your API using the Serverless Framework. This allows you to use a more friendly URL instead of the default API Gateway URL.

### Prerequisites

- A registered domain name
- A certificate in AWS Certificate Manager (ACM)
- Route 53 configured as your DNS provider (recommended)

### Installation Steps

1. Install the serverless-domain-manager plugin:

   ```bash
   npm install --save-dev serverless-domain-manager
   ```

2. Add the plugin and custom domain configuration to your `serverless.yml`:

   ```yaml
   plugins:
     - serverless-offline
     - serverless-dynamodb-local
     - serverless-domain-manager

   custom:
     # Existing custom configurations...

     customDomain:
       domainName: api.example.com
       basePath: '' # Leave empty for root path
       stage: ${self:provider.stage}
       createRoute53Record: true
       endpointType: 'regional'
       securityPolicy: tls_1_2
       apiType: rest
       autoDomain: true
   ```

3. Create the custom domain:

   ```bash
   npx serverless create-domain
   ```

4. Deploy your service:

   ```bash
   npm run deploy
   ```

After deployment, your API will be available at the custom domain (e.g., `https://api.example.com/item/{key}`).

### Regional vs Edge-Optimized Endpoints

- **Regional**: Faster access within the same AWS region
- **Edge-Optimized**: Better performance for geographically distributed clients

Choose the appropriate `endpointType` based on your use case.

### Path Mapping

You can also configure path mappings to have multiple APIs under different paths of the same domain:

```yaml
custom:
  customDomain:
    domainName: api.example.com
    basePath: 'store' # This will make your API available at api.example.com/store
```

## Environment Variables

This service can be configured using the following environment variables (see `.env.example` for reference):

| Environment Variable | Description                           | Default Value      |
| -------------------- | ------------------------------------- | ------------------ |
| `DEFAULT_TTL`        | Default TTL in seconds                | `86400` (24 hours) |
| `DYNAMODB_TABLE`     | DynamoDB table name                   | `KeyValueStore`    |
| `AWS_REGION`         | AWS region for deployment             | `ap-northeast-1`   |
| `STAGE`              | Deployment stage                      | `v1`               |
| `LOG_LEVEL`          | Logging level (ERROR/WARN/INFO/DEBUG) | `INFO`             |
| `DISABLE_AUTH_CHECK` | Disable auth check in development     | `true`             |

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

# Deploy to production stage (default)
npm run deploy -- --stage v1
# or simply
npm run deploy
```

### Setting a Default Stage

You can also set the default stage by:

1. Adding the stage parameter in `serverless.yml`:

   ```yaml
   provider:
     name: aws
     runtime: nodejs22.x
     stage: ${env:STAGE, 'v1'}
   ```

2. Setting an environment variable:

   ```bash
   export STAGE=v1
   npm run deploy
   ```

3. Adding it to your `.env` file:
   ```
   STAGE=v1
   ```

When multiple methods are used, the priority is as follows:

1. Command line option (`--stage`) has the highest priority
2. Environment variable set in the shell session
3. Value in the `.env` file
4. Default value in `serverless.yml`

Each stage will create its own isolated resources in AWS, including separate API Gateway endpoints, Lambda functions, and DynamoDB tables. This isolation ensures that changes to one environment do not affect others.

### Updating a Deployment

To update an existing deployment after making code changes:

```bash
# Update the current deployment
npm run deploy

# Update a specific stage
npm run deploy -- --stage dev
```

For smaller changes that only affect a single Lambda function, you can deploy just that function for faster updates:

```bash
npx serverless deploy function --function putItem
```

### Removing a Deployment

To completely remove a deployed service from AWS:

```bash
# Remove the current deployment
npx serverless remove

# Remove a specific stage
npx serverless remove --stage dev
```

This will delete all AWS resources created by the deployment, including Lambda functions, API Gateway endpoints, DynamoDB tables, and IAM roles.

## TTL Feature Details

- `X-TTL-Seconds`: Time in seconds specified in HTTP header after which the item will be automatically deleted (optional)
- If not specified, the value from the environment variable `DEFAULT_TTL` will be used (default is 24 hours)

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our development process, how to set up your environment, and how to submit pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Security

If you discover a security vulnerability within this project, please use GitHub's private vulnerability reporting feature instead of creating a public issue. For more information, visit [GitHub's documentation on privately reporting a security vulnerability](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability).
