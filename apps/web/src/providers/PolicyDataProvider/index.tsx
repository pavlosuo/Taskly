"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { axiosApi } from "@/api/index";
import { PolicyData } from "shared/types";

interface PolicyDataContextType {
  policyData: PolicyData;
  setPolicyData: React.Dispatch<React.SetStateAction<PolicyData>>;
  savePolicyData: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

interface PolicyDataProviderProps {
  children: ReactNode;
  initialPolicyData?: PolicyData;
}

const PolicyDataContext = createContext<PolicyDataContextType | null>(null);

export const PolicyDataProvider = ({
  children,
  initialPolicyData = {
    policyContent: "",
    policyTitle: "",
  },
}: PolicyDataProviderProps) => {
  const [policyData, setPolicyData] = useState<PolicyData>(initialPolicyData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const savePolicyData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await axiosApi.savePolicyData(policyData);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [policyData]);

  return (
    <PolicyDataContext.Provider
      value={{ policyData, setPolicyData, savePolicyData, loading, error }}
    >
      {children}
    </PolicyDataContext.Provider>
  );
};

export const usePolicyData = (): PolicyDataContextType => {
  const context = useContext(PolicyDataContext);
  if (!context)
    throw new Error("usePolicyData must be used within PolicyDataProvider");
  return context;
};
