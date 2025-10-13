import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { ContainerEntry, ItemBase } from '../types';
import { containerStorage } from '../utils/storage';

interface ContainerContextValue {
  entries: ContainerEntry[];
  addItem: (itemId: string, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateNote: (itemId: string, note: string) => void;
  clearContainer: () => void;
  getTotalItems: () => number;
  getTotalAmount: (items: ItemBase[]) => number;
  hasItem: (itemId: string) => boolean;
  getEntry: (itemId: string) => ContainerEntry | undefined;
}

const ContainerContext = createContext<ContainerContextValue | undefined>(undefined);

interface ContainerProviderProps {
  children: ReactNode;
}

export function ContainerProvider({ children }: ContainerProviderProps) {
  const [entries, setEntries] = useState<ContainerEntry[]>([]);

  // 初始化時從 localStorage 載入
  useEffect(() => {
    const saved = containerStorage.get();
    setEntries(saved);
  }, []);

  // 每次更新時存到 localStorage
  useEffect(() => {
    containerStorage.set(entries);
  }, [entries]);

  const addItem = useCallback((itemId: string, quantity = 1) => {
    setEntries((prev) => {
      const existing = prev.find((e) => e.itemId === itemId);
      if (existing) {
        // 已存在則增加數量
        return prev.map((e) =>
          e.itemId === itemId ? { ...e, quantity: (e.quantity || 1) + quantity } : e
        );
      } else {
        // 新增項目
        return [
          ...prev,
          {
            itemId,
            quantity,
            addedAt: new Date().toISOString(),
          },
        ];
      }
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setEntries((prev) => prev.filter((e) => e.itemId !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setEntries((prev) =>
      prev.map((e) => (e.itemId === itemId ? { ...e, quantity } : e))
    );
  }, [removeItem]);

  const updateNote = useCallback((itemId: string, note: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.itemId === itemId ? { ...e, note } : e))
    );
  }, []);

  const clearContainer = useCallback(() => {
    setEntries([]);
  }, []);

  const getTotalItems = useCallback(() => {
    return entries.reduce((sum, entry) => sum + (entry.quantity || 1), 0);
  }, [entries]);

  const getTotalAmount = useCallback((items: ItemBase[]) => {
    return entries.reduce((sum, entry) => {
      const item = items.find((i) => i.id === entry.itemId);
      const price = item?.price || 0;
      const quantity = entry.quantity || 1;
      return sum + price * quantity;
    }, 0);
  }, [entries]);

  const hasItem = useCallback((itemId: string) => {
    return entries.some((e) => e.itemId === itemId);
  }, [entries]);

  const getEntry = useCallback((itemId: string) => {
    return entries.find((e) => e.itemId === itemId);
  }, [entries]);

  return (
    <ContainerContext.Provider
      value={{
        entries,
        addItem,
        removeItem,
        updateQuantity,
        updateNote,
        clearContainer,
        getTotalItems,
        getTotalAmount,
        hasItem,
        getEntry,
      }}
    >
      {children}
    </ContainerContext.Provider>
  );
}

export function useContainer(): ContainerContextValue {
  const context = useContext(ContainerContext);
  if (!context) {
    throw new Error('useContainer must be used within ContainerProvider');
  }
  return context;
}

