import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { SubmitRecord, ContainerEntry, ItemBase } from '../types';
import { recordsStorage, exportToJson } from '../utils/storage';
import { v4 as uuidv4 } from 'uuid';

interface RecordsContextValue {
  records: SubmitRecord[];
  createRecord: (entries: ContainerEntry[], items: ItemBase[]) => SubmitRecord;
  getRecord: (id: string) => SubmitRecord | undefined;
  updateRecord: (id: string, updates: Partial<SubmitRecord>) => void;
  deleteRecord: (id: string) => void;
  exportRecord: (id: string) => void;
  exportAllRecords: () => void;
  clearAllRecords: () => void;
}

const RecordsContext = createContext<RecordsContextValue | undefined>(undefined);

interface RecordsProviderProps {
  children: ReactNode;
}

export function RecordsProvider({ children }: RecordsProviderProps) {
  const [records, setRecords] = useState<SubmitRecord[]>([]);

  // 初始化時從 localStorage 載入
  useEffect(() => {
    const saved = recordsStorage.getAll();
    setRecords(saved);
  }, []);

  const createRecord = useCallback((entries: ContainerEntry[], items: ItemBase[]) => {
    // 產生快照（只保留容器中的項目）
    const snapshot = entries
      .map((entry) => items.find((item) => item.id === entry.itemId))
      .filter((item): item is ItemBase => item !== undefined);

    // 計算總額與總數
    const totalAmount = entries.reduce((sum, entry) => {
      const item = snapshot.find((i) => i.id === entry.itemId);
      const price = item?.price || 0;
      const quantity = entry.quantity || 1;
      return sum + price * quantity;
    }, 0);

    const totalItems = entries.reduce((sum, entry) => sum + (entry.quantity || 1), 0);

    const record: SubmitRecord = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      entries,
      snapshot,
      totalAmount,
      totalItems,
    };

    recordsStorage.add(record);
    setRecords((prev) => [record, ...prev]);

    return record;
  }, []);

  const getRecord = useCallback((id: string) => {
    return records.find((r) => r.id === id);
  }, [records]);

  const updateRecord = useCallback((id: string, updates: Partial<SubmitRecord>) => {
    recordsStorage.update(id, updates);
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  }, []);

  const deleteRecord = useCallback((id: string) => {
    recordsStorage.delete(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const exportRecord = useCallback((id: string) => {
    const record = recordsStorage.getById(id);
    if (record) {
      const filename = `record-${id.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json`;
      exportToJson(record, filename);
    }
  }, []);

  const exportAllRecords = useCallback(() => {
    const filename = `all-records-${new Date().toISOString().slice(0, 10)}.json`;
    exportToJson(records, filename);
  }, [records]);

  const clearAllRecords = useCallback(() => {
    recordsStorage.clear();
    setRecords([]);
  }, []);

  return (
    <RecordsContext.Provider
      value={{
        records,
        createRecord,
        getRecord,
        updateRecord,
        deleteRecord,
        exportRecord,
        exportAllRecords,
        clearAllRecords,
      }}
    >
      {children}
    </RecordsContext.Provider>
  );
}

export function useRecords(): RecordsContextValue {
  const context = useContext(RecordsContext);
  if (!context) {
    throw new Error('useRecords must be used within RecordsProvider');
  }
  return context;
}

