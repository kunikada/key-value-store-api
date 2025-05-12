import { register } from 'tsconfig-paths';

// tsconfigのパスエイリアスを登録
register({
  baseUrl: '.',
  paths: {
    '@src/*': ['./src/*'],
    '@tests/*': ['./tests/*'],
  },
});
