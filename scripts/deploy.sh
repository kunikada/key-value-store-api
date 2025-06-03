#!/bin/bash
# 統一デプロイスクリプト
# SST v3 のタグ設定は sst.config.ts で管理されます

set -e

# ヘルプ関数
show_help() {
  cat << EOF
使用方法: $0 [オプション] [SST追加引数]

オプション:
  --with-tags     追加のタグ環境変数を設定してデプロイ
  --no-tags       最小限のタグでデプロイ（デフォルト）
  --stage STAGE   特定のステージを指定
  --help          このヘルプを表示

環境変数:
  DEPLOY_WITH_TAGS=true  追加タグ環境変数を有効にする
  STAGE                  デプロイするステージ（デフォルト: dev）
  PROJECT_NAME          プロジェクト名のタグ値
  OWNER                 オーナー情報のタグ値

注意: タグの実際の設定は sst.config.ts で管理されます

例:
  $0                    # 最小限のタグでデプロイ
  $0 --with-tags        # 追加タグ付きでデプロイ
  $0 --stage prod       # prodステージにデプロイ
  PROJECT_NAME=my-app $0 --with-tags  # カスタムプロジェクト名でデプロイ

EOF
}

# デフォルト値の設定
DEPLOY_WITH_TAGS=${DEPLOY_WITH_TAGS:-false}
CUSTOM_STAGE=""

# コマンドライン引数の解析
while [[ $# -gt 0 ]]; do
  case $1 in
    --with-tags)
      DEPLOY_WITH_TAGS=true
      shift
      ;;
    --no-tags)
      DEPLOY_WITH_TAGS=false
      shift
      ;;
    --stage)
      CUSTOM_STAGE="$2"
      shift 2
      ;;
    --help)
      show_help
      exit 0
      ;;
    *)
      # その他の引数はSSTに渡す
      break
      ;;
  esac
done

# .envファイルから環境変数を読み込む（存在する場合）
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# ステージの決定（優先度: コマンドライン > 環境変数 > デフォルト）
if [ -n "$CUSTOM_STAGE" ]; then
  STAGE="$CUSTOM_STAGE"
else
  STAGE="${STAGE:-dev}"
fi

# .sst/stageファイルを更新して.envのSTAGE変数と同期
mkdir -p .sst
echo "$STAGE" > .sst/stage

# タグ関連の環境変数設定（sst.config.tsで使用される）
if [ "$DEPLOY_WITH_TAGS" = "true" ]; then
  echo "🏷️  追加のタグ環境変数を設定してデプロイを実行します"
  
  # 環境変数が設定されている場合のみ表示
  if [ -n "$PROJECT_NAME" ]; then
    echo "   PROJECT_NAME: $PROJECT_NAME"
  fi
  if [ -n "$OWNER" ]; then
    echo "   OWNER: $OWNER"
  fi
  
  # 環境変数をエクスポート（sst.config.tsで参照される）
  export PROJECT_NAME="${PROJECT_NAME}"
  export OWNER="${OWNER}"
else
  echo "📦 最小限のタグでデプロイを実行します"
  # 追加タグ用の環境変数をクリア
  unset PROJECT_NAME
  unset OWNER
fi

# デプロイ情報の表示
echo "🚀 ステージ「$STAGE」にデプロイを開始します"
echo "ℹ️  追加引数: $*"

# デプロイコマンドの実行（SST v3ではタグはsst.config.tsで管理）
npx sst deploy --stage="$STAGE" "$@"

echo "✅ デプロイが完了しました！"