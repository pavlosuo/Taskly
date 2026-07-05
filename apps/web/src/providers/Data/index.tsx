"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { axiosApi } from "api/index";
import { Data } from "@shared/types";

interface DataContextType {
  data: Data;
  setData: React.Dispatch<React.SetStateAction<Data>>;
  saveData: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

interface DataProviderProps {
  children: ReactNode;
  initialData?: Data;
}

const DataContext = createContext<DataContextType | null>(null);

export const DataProvider = ({
  children,
  initialData = {
    policyContent: "",
    policyTitle: "",
  },
}: DataProviderProps) => {
  const [data, setData] = useState<Data>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await axiosApi.saveDataPolicy(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
      throw e;
    } finally {
      setLoading(false);
    }
  }, [data]);

  return (
    <DataContext.Provider value={{ data, setData, saveData, loading, error }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};
