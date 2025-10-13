import { useState, useCallback } from 'react';

/**
 * 比較功能 hook（最多 4 個項目）
 */
export function useCompare(maxItems = 4) {
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const toggleCompare = useCallback((itemId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      } else if (prev.length < maxItems) {
        return [...prev, itemId];
      } else {
        // 已達上限，不加入
        return prev;
      }
    });
  }, [maxItems]);

  const isComparing = useCallback((itemId: string) => {
    return compareIds.includes(itemId);
  }, [compareIds]);

  const clearCompare = useCallback(() => {
    setCompareIds([]);
  }, []);

  const canAddMore = compareIds.length < maxItems;

  return {
    compareIds,
    toggleCompare,
    isComparing,
    clearCompare,
    canAddMore,
    count: compareIds.length,
  };
}

