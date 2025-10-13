import { useState, useMemo, useCallback } from 'react';
import { useDebouncedValue } from './useDebounce';
import type { ItemBase, FilterState } from '../types';
import { applyFilters } from '../utils/filters';

export function useFilters(items: ItemBase[]) {
  const [filters, setFilters] = useState<FilterState>({
    keyword: '',
    categories: [],
    priceRange: undefined,
    ratingMin: undefined,
    sortBy: undefined,
    sortOrder: 'asc',
  });

  // Debounce 搜尋關鍵字（300ms）
  const debouncedKeyword = useDebouncedValue(filters.keyword, 300);

  // 套用 debounced 關鍵字的篩選器
  const activeFilters = useMemo(
    () => ({ ...filters, keyword: debouncedKeyword }),
    [filters, debouncedKeyword]
  );

  // 篩選後的結果（memo 化）
  const filteredItems = useMemo(
    () => applyFilters(items, activeFilters),
    [items, activeFilters]
  );

  // 更新篩選器
  const setKeyword = useCallback((keyword: string) => {
    setFilters((prev) => ({ ...prev, keyword }));
  }, []);

  const setCategories = useCallback((categories: string[]) => {
    setFilters((prev) => ({ ...prev, categories }));
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setFilters((prev) => {
      const isSelected = prev.categories.includes(category);
      const newCategories = isSelected
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories: newCategories };
    });
  }, []);

  const setPriceRange = useCallback((range?: [number, number]) => {
    setFilters((prev) => ({ ...prev, priceRange: range }));
  }, []);

  const setRatingMin = useCallback((rating?: number) => {
    setFilters((prev) => ({ ...prev, ratingMin: rating }));
  }, []);

  const setSortBy = useCallback((field?: string, order: 'asc' | 'desc' = 'asc') => {
    setFilters((prev) => ({ ...prev, sortBy: field as FilterState['sortBy'], sortOrder: order }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      keyword: '',
      categories: [],
      priceRange: undefined,
      ratingMin: undefined,
      sortBy: undefined,
      sortOrder: 'asc',
    });
  }, []);

  return {
    filters,
    filteredItems,
    setKeyword,
    setCategories,
    toggleCategory,
    setPriceRange,
    setRatingMin,
    setSortBy,
    resetFilters,
    isFiltering: debouncedKeyword !== filters.keyword, // 正在 debounce 中
  };
}

