#!/usr/bin/env node

// 環境変数の読み込みテスト
import fs from 'fs';
import path from 'path';

// .envファイルを手動で読み込み
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && !key.startsWith('#')) {
      process.env[key.trim()] = value.trim();
    }
  });
}

console.log('=== 環境変数テスト ===');
console.log('AWS_REGION from process.env:', process.env.AWS_REGION);
console.log('AWS_REGION from .env or default:', process.env.AWS_REGION || 'ap-northeast-1');
console.log('STAGE:', process.env.STAGE);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('====================');
