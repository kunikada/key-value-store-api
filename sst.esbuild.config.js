/**
 * SSTのesbuild設定
 * パスエイリアスの解決に使用されます
 */
const { resolve } = require('path');

module.exports = {
  alias: {
    '@src': resolve(__dirname, './src'),
    '@handlers': resolve(__dirname, './src/handlers'),
    '@types': resolve(__dirname, './src/types'),
    '@utils': resolve(__dirname, './src/utils'),
    '@tests': resolve(__dirname, './tests'),
  },
};
