/**
 * 通用項目資料結構（支援動態欄位）
 */
export type ItemBase = {
  id: string;
  name: string;
  category?: string;
  description?: string;
  image_url?: string;
  price?: number; // 範例數值欄位
  rating?: number; // 範例數值欄位
  stock?: number; // 範例數值欄位
  [key: string]: unknown; // 允許動態欄位
};

/**
 * 容器（暫存區）項目
 */
export type ContainerEntry = {
  itemId: string;
  quantity?: number;
  note?: string;
  addedAt: string; // ISO timestamp
};

/**
 * 已送出的記錄
 */
export type SubmitRecord = {
  id: string; // uuid
  createdAt: string; // ISO timestamp
  entries: ContainerEntry[];
  snapshot: ItemBase[]; // 提交當下的項目快照
  totalAmount?: number; // 總金額（若有 price）
  totalItems?: number; // 項目總數
};

/**
 * 篩選器狀態
 */
export type FilterState = {
  keyword: string;
  categories: string[];
  priceRange?: [number, number];
  ratingMin?: number;
  sortBy?: 'price' | 'rating' | 'name' | 'stock';
  sortOrder?: 'asc' | 'desc';
};

/**
 * 排序選項
 */
export type SortOption = {
  value: string;
  label: string;
  field: string;
  order: 'asc' | 'desc';
};

/**
 * CSV 載入狀態
 */
export type CsvLoadState = {
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
};

