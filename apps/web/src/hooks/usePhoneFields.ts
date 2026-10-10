import { useCallback, Dispatch, SetStateAction } from "react";

type PhoneFields = { phone: string; code: string; fullPhone: string };

export function buildFullPhone(code: string, phone: string) {
  return `${code ?? ""}${(phone ?? "").replace(/\s/g, "")}`;
}

export function usePhoneFields<T extends PhoneFields>(
  setForm: Dispatch<SetStateAction<T>>,
  onChange?: () => void,
) {
  const handleLocalPhone = useCallback(
    (phone: string) => {
      onChange?.();
      setForm((p) => ({
        ...p,
        phone,
        fullPhone: buildFullPhone(p.code, phone),
      }));
    },
    [setForm, onChange],
  );

  const handleCodeChange = useCallback(
    (code: string) => {
      onChange?.();
      setForm((p) => ({
        ...p,
        code,
        fullPhone: buildFullPhone(code, p.phone),
      }));
    },
    [setForm, onChange],
  );

  return { handleLocalPhone, handleCodeChange };
}
