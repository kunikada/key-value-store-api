import axios from 'axios';
import { createServer } from 'http';
// APIホストとポートの設定
export const API_HOST = 'http://localhost';
export const API_PORT = 3000;
export const API_URL = `${API_HOST}:${API_PORT}`;
// 基本的なレスポンスを返すモックサーバーを作成する
export const startServer = () => {
  return new Promise(resolve => {
    console.log('🚀 Starting Mock Server...');
    // シンプルなHTTPサーバーを作成
    const mockItems = new Map();
    const server = createServer((req, res) => {
      const url = req.url || '';
      const method = req.method || '';
      console.log(`${method} ${url}`);
      // CORS設定
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-TTL-Seconds');
      if (method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
      }
      // PUTリクエスト（アイテム保存）
      if (method === 'PUT' && url.startsWith('/item/')) {
        const key = url.replace('/item/', '');
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          mockItems.set(key, body);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/plain');
          res.end('Item successfully saved');
        });
        return;
      }
      // GETリクエスト（アイテム取得）
      if (method === 'GET' && url.startsWith('/item/')) {
        const key = url.replace('/item/', '');
        if (mockItems.has(key)) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/plain');
          res.end(mockItems.get(key));
        } else {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/plain');
          res.end('Item not found');
        }
        return;
      }
      // DELETEリクエスト（アイテム削除）
      if (method === 'DELETE' && url.startsWith('/item/')) {
        const key = url.replace('/item/', '');
        if (mockItems.has(key)) {
          mockItems.delete(key);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/plain');
          res.end('Item successfully deleted');
        } else {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/plain');
          res.end('Item not found');
        }
        return;
      }
      // POSTリクエスト（コード抽出）
      if (method === 'POST' && url.startsWith('/extractCode/')) {
        const key = url.replace('/extractCode/', '');
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          let processedBody = body;

          // application/x-www-form-urlencoded の場合はURLデコード、その他でもデコードに成功すればデコード結果を使用
          const contentType = req.headers['content-type'] || '';
          if (contentType.includes('application/x-www-form-urlencoded')) {
            processedBody = decodeURIComponent(body);
          } else {
            try {
              processedBody = decodeURIComponent(body);
            } catch {
              // デコード不要または失敗時は元のボディを使用
            }
          }

          // ヘッダーから抽出設定を取得（デフォルトは数字4桁以上）
          const digitsHeader = req.headers['x-digits'];
          const characterTypeHeader = req.headers['x-character-type'];
          const digits = digitsHeader ? parseInt(String(digitsHeader), 10) : 4;
          const characterType = characterTypeHeader || 'numeric';

          // パターンを決定
          let match = null;
          if (characterType === 'alphanumeric') {
            match = processedBody.match(new RegExp(`[A-Za-z0-9]{${digits},}`));
          } else {
            match = processedBody.match(new RegExp(`\\d{${digits},}`));
          }

          if (match) {
            const code = match[0];
            mockItems.set(key, code); // 既に文字列なので問題ない
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain');
            res.end(`Code extracted and stored successfully: ${code}`);
          } else {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'text/plain');
            res.end('No numeric code found in the text');
          }
        });
        return;
      }
      // デフォルトレスポンス
      res.statusCode = 404;
      res.end('Not Found');
    });
    server.listen(API_PORT, '0.0.0.0', () => {
      console.log(`✅ Mock server listening on port ${API_PORT}`);
      resolve(server);
    });
  });
};
// サーバーが応答するまで待機する関数
export const waitForServer = async (maxRetries = 10, retryInterval = 500) => {
  console.log('⏳ Waiting for server to be ready...');
  let retries = 0;
  while (retries < maxRetries) {
    try {
      // サーバーにリクエストを送信して応答をチェック
      await axios.get(`${API_URL}`);
      console.log('✅ Server is ready!');
      return;
    } catch (error) {
      if (error.response) {
        // ステータスコードがあれば（エラーレスポンスでも）サーバーは起動している
        console.log('✅ Server is ready!');
        return;
      }
      // リトライ
      retries++;
      console.log(`⏳ Retry ${retries}/${maxRetries}...`);
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
  }
  throw new Error('Server did not become ready in time');
};
// サーバープロセスを終了する関数
export const stopServer = server => {
  console.log('🛑 Stopping server...');
  if (server && server.close) {
    server.close();
  }
};
