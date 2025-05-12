#!/bin/bash

# Key-Value Store APIのセットアップスクリプト

echo "Key-Value Store APIセットアップを開始します..."

# 依存関係のインストール
echo "依存関係をインストールしています..."
npm install || { echo "依存関係のインストールに失敗しました"; exit 1; }

# 環境変数サンプルファイルのコピー（もしまだ存在しない場合）
if [ ! -f .env ]; then
  echo ".envファイルを作成しています..."
  cp .env.example .env || { echo ".envファイルの作成に失敗しました"; exit 1; }
  echo ".envファイルが作成されました。必要に応じて編集してください。"
fi

# AWS CLIの設定確認
echo "AWS CLI設定を確認しています..."
if ! aws sts get-caller-identity &> /dev/null; then
  echo "警告: AWS CLIが設定されていないか、認証情報が無効です。"
  echo "  以下のコマンドでAWS CLIを設定してください:"
  echo "  aws configure"
  echo ""
fi

# APIのビルド
echo "プロジェクトをビルドしています..."
npm run build || { echo "ビルドに失敗しました"; exit 1; }

echo "セットアップが完了しました！"
echo ""
echo "以下のコマンドでローカル開発サーバーを起動できます:"
echo "npm start"
echo ""
echo "以下のコマンドでAWSにデプロイできます:"
echo "npm run deploy"
echo ""