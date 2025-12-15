# Contributing to Key-Value Store API

This document explains the local development environment setup and development workflow for the Key-Value Store API project.

## AWS Architecture

This project implements a serverless architecture using multiple AWS services. The architecture diagram below illustrates how these services interact with each other.

### Architecture Diagram

```mermaid
graph TD
    Client[Client] -->|HTTP Request| APIG[Amazon API Gateway]
    APIG -->|Invoke| LambdaGet[Lambda: getItem]
    APIG -->|Invoke| LambdaPut[Lambda: putItem]
    APIG -->|Invoke| LambdaDel[Lambda: deleteItem]
    APIG -->|Invoke| LambdaExt[Lambda: extractAndStoreCode]

    LambdaGet -->|Read| DDB[(Amazon DynamoDB)]
    LambdaPut -->|Write| DDB
    LambdaDel -->|Delete| DDB
    LambdaExt -->|Extract & Write| DDB

    DDB -->|Auto-delete expired items| TTL[TTL Mechanism]

    subgraph "AWS Cloud"
        APIG
        subgraph "Lambda Functions"
            LambdaGet
            LambdaPut
            LambdaDel
            LambdaExt
        end
        DDB
        TTL
    end

    subgraph "Development & Deployment"
        SF[Serverless Framework] -->|Deploy| APIG
        SF -->|Deploy| LambdaGet
        SF -->|Deploy| LambdaPut
        SF -->|Deploy| LambdaDel
        SF -->|Deploy| LambdaExt
        SF -->|Configure| DDB
    end
```

### Architecture Components

- **API Gateway**: Provides a RESTful API interface for clients to interact with the service.
- **AWS Lambda**: Contains serverless functions that handle the business logic:
  - `getItem`: Retrieves values from DynamoDB using a key
  - `putItem`: Stores key-value pairs in DynamoDB
  - `deleteItem`: Removes items from DynamoDB based on a key
  - `extractAndStoreCode`: Extracts numeric codes from text and stores them
- **DynamoDB**: NoSQL database that stores the key-value pairs with automatic TTL capabilities
- **Serverless Framework**: Used for infrastructure as code, simplifying the deployment process

This architecture provides a highly scalable, cost-effective solution with minimal operational overhead as it leverages AWS's managed services and the serverless computing model.

## Project Structure

```
key-value-store-api/
├── CONTRIBUTING.md         # Contribution guidelines
├── LICENSE                 # MIT license
├── README.md               # Project documentation
├── eslint.config.js        # ESLint configuration
├── openapi.yaml            # OpenAPI specification
├── package.json            # Project dependencies and scripts
├── prettier.config.js      # Prettier configuration
├── serverless.yml          # Serverless Framework configuration
├── tsconfig.json           # TypeScript configuration
├── vitest.config.ts        # Vitest configuration
├── vitest.setup.ts         # Vitest setup file
├── scripts/
│   ├── create-local-table.sh  # Script to create local DynamoDB table
│   ├── seed-data.json         # Sample data for development
│   └── setup.sh               # Environment setup script
├── src/
│   ├── handlers/
│   │   ├── deleteItem.ts         # Handler for deleting an item
│   │   ├── extractAndStoreCode.ts # Handler for extracting and storing codes
│   │   ├── getItem.ts            # Handler for retrieving an item
│   │   ├── index.ts              # Index exports for handlers
│   │   └── putItem.ts            # Handler for adding a new item
│   ├── types/
│   │   └── index.ts            # Type definitions and interfaces
│   └── utils/
│       ├── dynamoDBClient.ts   # DynamoDB client configuration
│       ├── repositoryFactory.ts # Repository factory for DynamoDB operations
│       └── ttlHelper.ts        # TTL functionality helper
└── tests/
    ├── integration/
    │   ├── api.test.ts          # Integration tests for the API
    │   ├── apiClient.ts         # API client for integration tests
    │   └── setup.ts             # Setup for integration tests
    └── unit/
        ├── deleteItem.test.ts         # Unit tests for delete handler
        ├── extractAndStoreCode.test.ts # Unit tests for extract and store handler
        ├── getItem.test.ts            # Unit tests for get handler
        ├── putItem.test.ts            # Unit tests for put handler
        └── ttlHelper.test.ts          # Unit tests for TTL helper
```

## Development Environment Setup

There are two ways to set up the development environment:

1. **DevContainer (Recommended)**: Development environment using VS Code
2. **Traditional Method**: Direct setup on your local machine

### Development with DevContainer (Recommended)

Using DevContainer provides a consistent development environment with all the tools and dependencies pre-configured for the project.

#### Prerequisites

- [VS Code](https://code.visualstudio.com/)
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) for VS Code
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) or other Docker-compatible environment

#### Setup Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/kunikada/key-value-store-api.git
   cd key-value-store-api
   ```

2. Open the project folder in VS Code:

   ```bash
   code .
   ```

3. VS Code will detect the `.devcontainer` folder and prompt you to "Reopen in Container".
   Alternatively, open the command palette (`F1` key) and select "Remote-Containers: Reopen in Container".

4. The DevContainer will build, and VS Code will automatically restart inside the container.
   This process may take a few minutes on first run.

5. Once the container starts, all dependencies will be automatically installed and the development environment will be configured.

### Traditional Method (Direct Setup)

#### Prerequisites

Before starting development, you need to have the following tools installed:

- Node.js 22.x or higher
- npm 10.x or higher
- AWS CLI
- Java Runtime Environment (JRE) 11 or higher (for DynamoDB local)

#### Environment Setup Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/kunikada/key-value-store-api.git
   cd key-value-store-api
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables:

   ```bash
   cp .env.example .env
   ```

   Open the `.env` file and edit the values as needed.

4. Run the setup script:
   ```bash
   bash ./scripts/setup.sh
   ```

## Local Development

### Starting the Local Development Environment (Integrated Method)

The simplest way is to use the integrated method that performs all setup with a single command:

```bash
npm run dev
```

This command executes the following processes in sequence:

1. Installs the serverless-dynamodb-local plugin (if needed)
2. Starts DynamoDB Local
3. Starts the API server (Serverless Offline)

### Starting Individual Services (Traditional Method)

If you want to start services individually, you can follow these steps:

#### Running DynamoDB Local

DynamoDB Local is started using the serverless-dynamodb-local plugin:

```bash
npx serverless dynamodb start
```

This command starts DynamoDB Local on port 8000. On first run, the necessary files will be downloaded automatically.

#### Creating Local Tables

```bash
bash ./scripts/create-local-table.sh
```

#### Starting the Development Server

```bash
npm start
```

This emulates the API Gateway environment and is typically accessible at `http://localhost:3000`.

### Debugging

If you're using VS Code, you can use the pre-configured debug configurations in `.vscode/launch.json`:

1. Debugging tests:
   - Open a test file and select "Debug Tests" from the VS Code debug panel

2. Debugging Serverless Offline:
   - First, start the server in debug mode:
     ```bash
     npm start -- --inspect
     ```
   - Select "Attach to Serverless Offline" from the VS Code debug panel

## Testing

### Running Unit Tests

```bash
npm test
```

### Running Tests in Watch Mode

```bash
npm run test:watch
```

### Checking Test Coverage

```bash
npm run test:coverage
```

## Code Style and Linting

This project uses ESLint and Prettier to maintain code quality and style.

### Running Linting

```bash
npm run lint
```

### Auto-fixing Issues

```bash
npm run lint:fix
```

### Code Formatting

```bash
npm run format
```

## Logging Policy

This project follows a structured logging approach with the following principles:

### Log Level Strategy

- **ERROR**: Critical errors that require immediate attention
- **WARN**: Warning conditions that indicate potential issues
- **INFO**: General information about successful operations (minimal in production)
- **DEBUG**: Detailed diagnostic information for development and troubleshooting

### Environment-based Log Level Configuration

The log level can be configured using the `LOG_LEVEL` environment variable:

```bash
# In .env file
LOG_LEVEL=INFO  # Options: ERROR, WARN, INFO, DEBUG
```

**Default behavior:**

- **Production environment** (`NODE_ENV=production`): WARN level and above
- **Development environment**: INFO level and above
- **Custom override**: Set `LOG_LEVEL` environment variable to override defaults

### Logging Guidelines

1. **Normal Operations**: Minimize log output to reduce noise
   - Use `logInfo()` sparingly for successful operations
   - Use `logDebug()` for detailed diagnostic information

2. **Error Conditions**: Provide comprehensive logging for troubleshooting
   - Include detailed context information (request parameters, error details)
   - Log warning conditions that might indicate issues
   - Include relevant request data in error logs (first 500 characters of body, path parameters, etc.)

3. **Structured Logging**: All logs are output as structured JSON for better parsing and analysis in AWS CloudWatch

4. **Security**: Sensitive information (API keys, authentication tokens) is filtered out from logs

### Example Usage

```typescript
// Normal operation (minimal logging in production)
logInfo('Operation completed successfully', requestInfo, { key, resultSize });

// Error condition (detailed logging)
logError('Database operation failed', error, requestInfo, {
  operation: 'putItem',
  key,
  requestBody: event.body?.substring(0, 500),
  pathParameters: event.pathParameters,
});

// Debug information (development only)
logDebug('Processing parameters', requestInfo, {
  extractedParams: params,
  validationResults: results,
});
```

## Testing the API

To test the API in the local environment, you can use curl commands as follows:

### Authentication

When testing locally with serverless-offline, API key authentication is enabled by default. You need to pass an API key with each request:

```bash
# For local development, you can use any string as the API key
API_KEY="dev-api-key-for-testing"
```

For deployed environments, you need to retrieve the actual API key:

```bash
# Get the API key from your deployed service
API_KEY=$(npx serverless info | grep -A 1 "api keys:" | tail -n 1 | tr -d ' ')
```

### Getting an Item

```bash
curl -H "x-api-key: $API_KEY" http://localhost:3000/item/testKey
```

### Saving an Item

```bash
curl -X PUT \
  -H "Content-Type: text/plain" \
  -H "X-TTL-Seconds: 3600" \
  -H "x-api-key: $API_KEY" \
  -d "Test data" \
  http://localhost:3000/item/testKey
```

### Extracting and Storing a Code

```bash
curl -X POST \
  -H "Content-Type: text/plain" \
  -H "X-TTL-Seconds: 3600" \
  -H "x-api-key: $API_KEY" \
  -d "Your verification code is 123456" \
  http://localhost:3000/extractCode/testKey
```

### Deleting an Item

```bash
curl -X DELETE -H "x-api-key: $API_KEY" http://localhost:3000/item/testKey
```

## Deployment

After testing your changes locally, to deploy to AWS:

```bash
npm run deploy
```

This command uses the Serverless Framework to deploy your application. Make sure your AWS credentials are correctly configured before deploying.

## Recommended Development Tools

We recommend using the following VS Code extensions for this project:

- ESLint
- Prettier
- TypeScript Next
- AWS Toolkit
- YAML
- Docker
- DotENV
- Path Intellisense
- Vitest

## CI/CD

A CI pipeline using GitHub Actions is set up. Pushes to the master or main branch will automatically run tests to ensure code quality. Deployment is performed manually after tests have passed successfully.

## Logging and Troubleshooting

### API Key Authentication Errors

When API key authentication fails, you'll receive one of the following responses:

- **401 Unauthorized**: Missing API key in the request
- **403 Forbidden**: Invalid or expired API key

These errors are logged at the API Gateway level, and can be viewed in CloudWatch Logs under the API Gateway access logs.

### TTL Configuration Errors

TTL (Time-To-Live) configuration errors are logged at the Lambda function level:

- Invalid TTL values in headers or query parameters will generate warnings
- TTL values must be positive integers representing seconds
- If no valid TTL is provided, the default TTL from environment variables will be used

### Log Levels

The service uses structured logging with the following levels:

- **ERROR**: Critical errors requiring immediate attention
- **WARN**: Warning conditions and validation failures
- **INFO**: General operational information (minimal in production)
- **DEBUG**: Detailed diagnostic information (development only)

Log level can be controlled using the `LOG_LEVEL` environment variable. Default levels are:

- Production: `WARN` and above
- Development: `INFO` and above

### Viewing Logs in Development

During local development, logs are output to the console. In AWS, logs are sent to CloudWatch Logs where they can be viewed and analyzed.

### Authentication Logging in Development

In development mode, authentication information is logged for debugging purposes. The development environment includes additional flexibility for authentication handling:

**Disabling Authentication in Development:**
Set `DISABLE_AUTH_CHECK=true` in your `.env` file to disable authentication checks during local development. This is useful when testing the API without needing to provide API keys.

**Environment-based Authentication Behavior:**

- **Production/AWS Environment**: API Gateway handles authentication automatically
- **Development Environment**: Custom authentication middleware validates API keys
- **Test Environment**: Authentication is automatically disabled for unit tests

**Note**: In production deployments, API Gateway handles all authentication automatically, and the development authentication middleware is bypassed.
