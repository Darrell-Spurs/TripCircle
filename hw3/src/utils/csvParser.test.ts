import { describe, it, expect } from 'vitest';
import { parseCsvText, extractCategories, getNumericRange } from './csvParser';
import type { ItemBase } from '../types';

describe('csvParser', () => {
  describe('parseCsvText', () => {
    it('應該正確解析 CSV 文字', () => {
      const csvText = `id,name,category,price
1,Apple,Fruit,100
2,Banana,Fruit,50`;

      const result = parseCsvText(csvText);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[0].name).toBe('Apple');
      expect(result[0].category).toBe('Fruit');
      expect(result[0].price).toBe(100);
    });

    it('應該自動產生 id 若缺少', () => {
      const csvText = `name,category,price
Apple,Fruit,100
Banana,Fruit,50`;

      const result = parseCsvText(csvText);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('item-1');
      expect(result[1].id).toBe('item-2');
    });

    it('應該處理空行', () => {
      const csvText = `id,name,price
1,Apple,100

2,Banana,50`;

      const result = parseCsvText(csvText);
      expect(result).toHaveLength(2);
    });
  });

  describe('extractCategories', () => {
    it('應該提取唯一分類', () => {
      const items: ItemBase[] = [
        { id: '1', name: 'Apple', category: '水果' },
        { id: '2', name: 'Banana', category: '水果' },
        { id: '3', name: 'Carrot', category: '蔬菜' },
      ];

      const categories = extractCategories(items);
      expect(categories).toEqual(['水果', '蔬菜']);
    });

    it('應該排序分類', () => {
      const items: ItemBase[] = [
        { id: '1', name: 'Apple', category: 'C' },
        { id: '2', name: 'Banana', category: 'A' },
        { id: '3', name: 'Carrot', category: 'B' },
      ];

      const categories = extractCategories(items);
      expect(categories).toEqual(['A', 'B', 'C']);
    });
  });

  describe('getNumericRange', () => {
    it('應該取得數值欄位的範圍', () => {
      const items: ItemBase[] = [
        { id: '1', name: 'A', price: 100 },
        { id: '2', name: 'B', price: 50 },
        { id: '3', name: 'C', price: 200 },
      ];

      const range = getNumericRange(items, 'price');
      expect(range).toEqual([50, 200]);
    });

    it('應該過濾非數值', () => {
      const items: ItemBase[] = [
        { id: '1', name: 'A', price: 100 },
        { id: '2', name: 'B', price: undefined },
        { id: '3', name: 'C', price: 200 },
      ];

      const range = getNumericRange(items, 'price');
      expect(range).toEqual([100, 200]);
    });

    it('無數值時應返回 [0, 0]', () => {
      const items: ItemBase[] = [
        { id: '1', name: 'A' },
        { id: '2', name: 'B' },
      ];

      const range = getNumericRange(items, 'price');
      expect(range).toEqual([0, 0]);
    });
  });
});

