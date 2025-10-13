import Papa from 'papaparse';
import type { ItemBase } from '../types';

/**
 * 從遠端 URL 載入並解析 CSV
 */
export async function loadCsvFromUrl(url: string): Promise<ItemBase[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText}`);
    }
    const csvText = await response.text();
    return parseCsvText(csvText);
  } catch (error) {
    console.error('Error loading CSV:', error);
    throw error;
  }
}

/**
 * 解析 CSV 文字內容
 */
export function parseCsvText(csvText: string): ItemBase[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true, // 自動轉換數字
    transform: (value: string) => value.trim(),
  });

  if (result.errors.length > 0) {
    console.warn('CSV parsing warnings:', result.errors);
  }

  return result.data.map((row, index) => {
    // 若無 id，以索引產生穩定 id
    const id = row.id?.toString() || `item-${index + 1}`;

    return {
      ...row,
      id,
      name: row.name || `Item ${id}`,
    } as ItemBase;
  });
}

/**
 * 從多個 CSV 檔案載入資料
 */
export async function loadMultipleCsvFiles(urls: string[]): Promise<ItemBase[]> {
  const results = await Promise.all(urls.map((url) => loadCsvFromUrl(url)));
  return results.flat();
}

/**
 * 取得所有唯一分類
 */
export function extractCategories(items: ItemBase[]): string[] {
  const categories = new Set<string>();
  items.forEach((item) => {
    if (item.category) {
      categories.add(item.category);
    }
  });
  return Array.from(categories).sort();
}

/**
 * 取得數值欄位範圍
 */
export function getNumericRange(items: ItemBase[], field: string): [number, number] {
  const values = items
    .map((item) => item[field] as number)
    .filter((val) => typeof val === 'number' && !isNaN(val));

  if (values.length === 0) return [0, 0];

  return [Math.min(...values), Math.max(...values)];
}

