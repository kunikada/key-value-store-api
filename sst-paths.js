/**
 * SSTビルドのためのパスエイリアス設定
 *
 * この設定は、ビルド時にtsconfigのpaths設定を解決するために使用されます
 */
const { resolve } = import('path');

module.exports = {
  '~/src/*': [resolve(__dirname, './src/*')],
  '@src/*': [resolve(__dirname, './src/*')],
  '@handlers/*': [resolve(__dirname, './src/handlers/*')],
  '@types/*': [resolve(__dirname, './src/types/*')],
  '@utils/*': [resolve(__dirname, './src/utils/*')],
  '@tests/*': [resolve(__dirname, './tests/*')],
};
