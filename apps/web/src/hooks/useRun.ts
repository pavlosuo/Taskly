import { useCallback } from "react";
import { getAxiosError } from "@/utils/getAxiosError";
import { useToast } from "@/hooks/useToast";

interface RunOptions {
  success?: string;
  loading?: boolean;
}

export function useRun(setIsLoading: (value: boolean) => void) {
  const toast = useToast();
  return useCallback(
    async <T>(fn: () => Promise<T>, options: RunOptions = {}): Promise<T> => {
      const { success, loading = true } = options;
      if (loading) setIsLoading(true);
      try {
        const result = await fn();
        toast(success, "success");
        return result;
      } catch (e) {
        toast(getAxiosError(e));
        throw e;
      } finally {
        if (loading) setIsLoading(false);
      }
    },
    [toast, setIsLoading],
  );
}
