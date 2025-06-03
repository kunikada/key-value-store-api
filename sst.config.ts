/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    const region = process.env.AWS_REGION || 'ap-northeast-1';
    return {
      name: 'key-value-store-api',
      removal: input?.stage !== 'dev' ? 'remove' : 'retain',
      home: 'aws',
      providers: {
        aws: {
          region: region as any,
        },
      },
    };
  },
  async run() {
    const { ApiStack } = await import('./stacks/ApiStack');
    return {
      ...ApiStack(),
    };
  },
});
