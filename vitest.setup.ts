import { register } from 'tsconfig-paths';

// SSTのテスト環境変数を設定
process.env.TABLE_NAME = process.env.TABLE_NAME || 'KeyValueStore';
process.env.DEFAULT_TTL = process.env.DEFAULT_TTL || '86400';
process.env.AWS_REGION = process.env.AWS_REGION || 'ap-northeast-1';

// tsconfigのパスエイリアスを登録
register({
  baseUrl: '.',
  paths: {
    '@src/*': ['./src/*'],
    '@tests/*': ['./tests/*'],
    '@handlers/*': ['./src/handlers/*'],
    '@types/*': ['./src/types/*'],
    '@utils/*': ['./src/utils/*'],
  },
});
