import type { ContainerEntry, SubmitRecord } from '../types';

const STORAGE_KEYS = {
  CONTAINER: 'catalog_container',
  RECORDS: 'catalog_records',
} as const;

/**
 * localStorage 通用存取
 */
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Failed to parse ${key} from localStorage:`, error);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage:`, error);
  }
}

/**
 * 購物車（暫存區）操作
 */
export const containerStorage = {
  get: (): ContainerEntry[] => getItem(STORAGE_KEYS.CONTAINER, []),

  set: (entries: ContainerEntry[]): void => {
    setItem(STORAGE_KEYS.CONTAINER, entries);
  },

  clear: (): void => {
    localStorage.removeItem(STORAGE_KEYS.CONTAINER);
  },
};

/**
 * 記錄操作
 */
export const recordsStorage = {
  getAll: (): SubmitRecord[] => getItem(STORAGE_KEYS.RECORDS, []),

  add: (record: SubmitRecord): void => {
    const records = recordsStorage.getAll();
    records.unshift(record); // 新記錄在前
    setItem(STORAGE_KEYS.RECORDS, records);
  },

  getById: (id: string): SubmitRecord | undefined => {
    const records = recordsStorage.getAll();
    return records.find((r) => r.id === id);
  },

  update: (id: string, updates: Partial<SubmitRecord>): void => {
    const records = recordsStorage.getAll();
    const index = records.findIndex((r) => r.id === id);
    if (index !== -1) {
      records[index] = { ...records[index], ...updates };
      setItem(STORAGE_KEYS.RECORDS, records);
    }
  },

  delete: (id: string): void => {
    const records = recordsStorage.getAll();
    const filtered = records.filter((r) => r.id !== id);
    setItem(STORAGE_KEYS.RECORDS, filtered);
  },

  clear: (): void => {
    localStorage.removeItem(STORAGE_KEYS.RECORDS);
  },
};

/**
 * 匯出為 JSON 檔案
 */
export function exportToJson(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

