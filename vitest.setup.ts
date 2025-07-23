import { register } from 'tsconfig-paths';

// tsconfigのパスエイリアスを登録
register({
  baseUrl: '.',
  paths: {
    '@src/*': ['./src/*'],
    '@tests/*': ['./tests/*'],
  },
});

// テスト環境での認証チェックを無効化
process.env.NODE_ENV = 'test';
process.env.DISABLE_AUTH_CHECK = 'true';
