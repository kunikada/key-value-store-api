#!/bin/bash
# SSTの開発環境を起動するスクリプト

# .envファイルから環境変数を読み込む（存在する場合）
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# 開発環境変数を設定
export IS_LOCAL=true
export AWS_REGION=${AWS_REGION:-"ap-northeast-1"}
export TABLE_NAME=${TABLE_NAME:-"KeyValueStore"}
export DEFAULT_TTL=${DEFAULT_TTL:-"86400"}
export STAGE=${STAGE:-"dev"}

# .sst/stageファイルを更新して.envのSTAGE変数と同期
mkdir -p .sst
echo "$STAGE" > .sst/stage

# SSTの開発環境を起動
npx sst dev
