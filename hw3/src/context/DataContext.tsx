import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { ItemBase, CsvLoadState } from '../types';
import { loadCsvFromUrl, extractCategories } from '../utils/csvParser';

interface DataContextValue {
  items: ItemBase[];
  categories: string[];
  loadState: CsvLoadState;
  reloadData: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
  csvUrls?: string[];
}

export function DataProvider({ children, csvUrls = ['/data/items.csv'] }: DataProviderProps) {
  const [items, setItems] = useState<ItemBase[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loadState, setLoadState] = useState<CsvLoadState>({
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const loadData = useCallback(async () => {
    setLoadState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // 支援多個 CSV 檔案
      const allItems: ItemBase[] = [];
      for (const url of csvUrls) {
        const data = await loadCsvFromUrl(url);
        allItems.push(...data);
      }

      setItems(allItems);
      setCategories(extractCategories(allItems));
      setLoadState({
        loading: false,
        error: null,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLoadState({
        loading: false,
        error: errorMessage,
        lastUpdated: null,
      });
      console.error('Failed to load CSV data:', error);
    }
  }, [csvUrls]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const reloadData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return (
    <DataContext.Provider value={{ items, categories, loadState, reloadData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}

