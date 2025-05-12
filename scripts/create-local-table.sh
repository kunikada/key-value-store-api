#!/bin/bash

# ローカルDynamoDBテーブル作成スクリプト

echo "ローカルでのDynamoDBテーブルセットアップを開始します..."

# 環境変数の読み込み
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# テーブル名のデフォルト値設定
TABLE_NAME=${TABLE_NAME:-"key-value-store"}

# ローカルDynamoDBテーブル作成
echo "テーブル '${TABLE_NAME}' を作成しています..."

aws dynamodb create-table \
  --table-name ${TABLE_NAME} \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000 \
  --region ${AWS_REGION:-"us-east-1"} || { echo "テーブル作成に失敗しました"; exit 1; }

# TTLの有効化
echo "TTLを有効化しています..."
aws dynamodb update-time-to-live \
  --table-name ${TABLE_NAME} \
  --time-to-live-specification "Enabled=true, AttributeName=ttl" \
  --endpoint-url http://localhost:8000 \
  --region ${AWS_REGION:-"us-east-1"} || { echo "TTL設定に失敗しました"; exit 1; }

echo "テーブルセットアップが完了しました！"
echo ""
echo "以下のコマンドでローカルテーブルの内容を確認できます:"
echo "aws dynamodb scan --table-name ${TABLE_NAME} --endpoint-url http://localhost:8000"
echo ""