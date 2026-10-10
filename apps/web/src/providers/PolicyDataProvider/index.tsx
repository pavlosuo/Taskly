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
import { getAxiosError } from "@/utils/getAxiosError";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "react-i18next";

interface PolicyDataContextType {
  policyData: PolicyData;
  setPolicyData: React.Dispatch<React.SetStateAction<PolicyData>>;
  savePolicyData: () => Promise<void>;
  loading: boolean;
}

interface PolicyDataProviderProps {
  children: ReactNode;
  initialPolicyData?: PolicyData;
}

const PolicyDataContext = createContext<PolicyDataContextType | null>(null);

export const PolicyDataProvider = ({
  children,
  initialPolicyData = { translations: {} },
}: PolicyDataProviderProps) => {
  const [policyData, setPolicyData] = useState<PolicyData>(initialPolicyData);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation("policy");
  const toast = useToast();

  const savePolicyData = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      await axiosApi.savePolicyData({ translations: policyData.translations });
      toast(t("policy:updated"), "success");
    } catch (e) {
      toast(getAxiosError(e));
    } finally {
      setLoading(false);
    }
  }, [policyData.translations, loading, toast, t]);

  return (
    <PolicyDataContext.Provider
      value={{ policyData, setPolicyData, savePolicyData, loading }}
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
