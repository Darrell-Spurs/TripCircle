import type { ItemBase, FilterState } from '../types';

/**
 * 模糊搜尋（支援多欄位）
 */
export function fuzzySearch(items: ItemBase[], keyword: string): ItemBase[] {
  if (!keyword.trim()) return items;

  const lowerKeyword = keyword.toLowerCase();

  return items.filter((item) => {
    // 搜尋 name, description, category 以及其他字串欄位
    const searchableFields = [
      item.name,
      item.description,
      item.category,
      ...Object.values(item).filter((val) => typeof val === 'string'),
    ];

    return searchableFields.some(
      (field) => field && String(field).toLowerCase().includes(lowerKeyword)
    );
  });
}

/**
 * 分類篩選
 */
export function filterByCategories(items: ItemBase[], categories: string[]): ItemBase[] {
  if (categories.length === 0) return items;
  return items.filter((item) => item.category && categories.includes(item.category));
}

/**
 * 價格區間篩選
 */
export function filterByPriceRange(
  items: ItemBase[],
  range?: [number, number]
): ItemBase[] {
  if (!range) return items;
  const [min, max] = range;
  return items.filter((item) => {
    const price = item.price;
    return typeof price === 'number' && price >= min && price <= max;
  });
}

/**
 * 評分篩選
 */
export function filterByRating(items: ItemBase[], minRating?: number): ItemBase[] {
  if (minRating === undefined) return items;
  return items.filter((item) => {
    const rating = item.rating;
    return typeof rating === 'number' && rating >= minRating;
  });
}

/**
 * 排序
 */
export function sortItems(
  items: ItemBase[],
  field?: string,
  order: 'asc' | 'desc' = 'asc'
): ItemBase[] {
  if (!field) return items;

  const sorted = [...items].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];

    // 數值排序
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    }

    // 字串排序
    const aStr = String(aVal || '');
    const bStr = String(bVal || '');
    const comparison = aStr.localeCompare(bStr);
    return order === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

/**
 * 綜合篩選（套用所有條件）
 */
export function applyFilters(items: ItemBase[], filters: FilterState): ItemBase[] {
  let result = items;

  // 搜尋
  result = fuzzySearch(result, filters.keyword);

  // 分類
  result = filterByCategories(result, filters.categories);

  // 價格區間
  result = filterByPriceRange(result, filters.priceRange);

  // 評分
  result = filterByRating(result, filters.ratingMin);

  // 排序
  if (filters.sortBy) {
    result = sortItems(result, filters.sortBy, filters.sortOrder);
  }

  return result;
}

