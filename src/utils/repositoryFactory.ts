import { KeyValueRepository } from '@src/utils/dynamoDBClient';

// リポジトリインスタンスを保持する変数
let repositoryInstance: KeyValueRepository | null = null;

/**
 * リポジトリインスタンスを設定する関数
 * テスト時などに利用する
 */
export const setRepository = (repository: KeyValueRepository): void => {
  repositoryInstance = repository;
};

/**
 * リポジトリインスタンスを取得する関数
 * 未設定の場合はデフォルトのリポジトリインスタンスを返す
 */
export const getRepository = async (): Promise<KeyValueRepository> => {
  if (!repositoryInstance) {
    // 動的インポートでデフォルトリポジトリを取得
    const { defaultRepository } = await import('../utils/dynamoDBClient');
    repositoryInstance = defaultRepository;
  }
  return repositoryInstance;
};
