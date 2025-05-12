interface KeyValueItem {
  key: string;
  value: string;
  ttl?: number; // Unix timestamp (秒単位) で期限切れ時間を表す
}

interface TTLConfig {
  enabled: boolean;
  defaultTTL?: number; // デフォルトのTTL（秒単位）
}

export type { KeyValueItem, TTLConfig };
