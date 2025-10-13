import { describe, it, expect } from 'vitest';
import { fuzzySearch, sortItems, applyFilters } from './filters';
import type { ItemBase, FilterState } from '../types';

describe('filters', () => {
  const mockItems: ItemBase[] = [
    { id: '1', name: 'Apple', category: '水果', price: 100, rating: 4.5 },
    { id: '2', name: 'Banana', category: '水果', price: 50, rating: 4.0 },
    { id: '3', name: 'Carrot', category: '蔬菜', price: 30, rating: 4.8 },
    { id: '4', name: 'Durian', category: '水果', price: 200, rating: 3.5 },
  ];

  describe('fuzzySearch', () => {
    it('應該以關鍵字搜尋項目名稱', () => {
      const result = fuzzySearch(mockItems, 'apple');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Apple');
    });

    it('應該不區分大小寫', () => {
      const result = fuzzySearch(mockItems, 'BANANA');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Banana');
    });

    it('空關鍵字應該返回所有項目', () => {
      const result = fuzzySearch(mockItems, '');
      expect(result).toHaveLength(4);
    });

    it('應該搜尋分類', () => {
      const result = fuzzySearch(mockItems, '水果');
      expect(result).toHaveLength(3);
    });
  });

  describe('sortItems', () => {
    it('應該依價格遞增排序', () => {
      const result = sortItems(mockItems, 'price', 'asc');
      expect(result[0].price).toBe(30);
      expect(result[3].price).toBe(200);
    });

    it('應該依價格遞減排序', () => {
      const result = sortItems(mockItems, 'price', 'desc');
      expect(result[0].price).toBe(200);
      expect(result[3].price).toBe(30);
    });

    it('應該依評分遞減排序', () => {
      const result = sortItems(mockItems, 'rating', 'desc');
      expect(result[0].rating).toBe(4.8);
      expect(result[3].rating).toBe(3.5);
    });

    it('應該依名稱排序', () => {
      const result = sortItems(mockItems, 'name', 'asc');
      expect(result[0].name).toBe('Apple');
      expect(result[3].name).toBe('Durian');
    });

    it('無排序欄位應返回原陣列', () => {
      const result = sortItems(mockItems, undefined, 'asc');
      expect(result).toEqual(mockItems);
    });
  });

  describe('applyFilters', () => {
    it('應該套用綜合篩選', () => {
      const filters: FilterState = {
        keyword: '水果',
        categories: ['水果'],
        priceRange: [0, 150],
        ratingMin: 4.0,
        sortBy: 'price',
        sortOrder: 'asc',
      };

      const result = applyFilters(mockItems, filters);

      // 應該只有 Banana (水果, 50元, 4.0分)
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Banana');
    });

    it('應該套用價格區間篩選', () => {
      const filters: FilterState = {
        keyword: '',
        categories: [],
        priceRange: [40, 120],
      };

      const result = applyFilters(mockItems, filters);
      expect(result).toHaveLength(2); // Banana (50) 和 Apple (100)
    });

    it('應該套用最低評分篩選', () => {
      const filters: FilterState = {
        keyword: '',
        categories: [],
        ratingMin: 4.5,
      };

      const result = applyFilters(mockItems, filters);
      expect(result).toHaveLength(2); // Apple (4.5) 和 Carrot (4.8)
    });
  });
});

