"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/useTranslation";

interface AlertOptions {
  title?: string;
  message: string;
  confirmText?: string;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

interface ModalContextType {
  alert: (options: AlertOptions | string) => Promise<void>;
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

interface ModalState {
  type: "alert" | "confirm" | null;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  resolve:
    ((value: boolean | undefined | null | PromiseLike<boolean>) => void) | null;
}

const initialState: ModalState = {
  type: null,
  title: "",
  message: "",
  confirmText: "common:confirmText",
  cancelText: "common:cancelText",
  resolve: null,
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error("useModal must be used within ModalProvider");
  return context;
};

export const ModalProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [modalState, setModalState] = useState<ModalState>(initialState);
  const [open, setOpen] = useState(false);
  const { t } = useTranslation("common");

  const alert = useCallback((options: AlertOptions | string): Promise<void> => {
    return new Promise((resolve) => {
      const opts = typeof options === "string" ? { message: options } : options;
      setModalState({
        type: "alert",
        title: opts.title || "common:alertTitle",
        message: opts.message,
        confirmText: opts.confirmText || initialState.confirmText,
        cancelText: "",
        resolve: () => {
          setTimeout(() => setOpen(false), 50);
          resolve();
        },
      });
      setOpen(true);
    });
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions | string): Promise<boolean> => {
      return new Promise((resolve) => {
        const opts =
          typeof options === "string" ? { message: options } : options;
        setModalState({
          type: "confirm",
          title: opts.title || "common:confirmTitle",
          message: opts.message,
          confirmText: opts.confirmText || initialState.confirmText,
          cancelText: opts.cancelText || initialState.cancelText,
          resolve: (value) => {
            setTimeout(() => setOpen(false), 50);
            resolve(value as boolean);
          },
        });
        setOpen(true);
      });
    },
    [],
  );

  const handleConfirm = () => modalState.resolve?.(true);

  const handleCancel = () => {
    setTimeout(() => setOpen(false), 50);
    modalState.resolve?.(modalState.type === "confirm" ? false : undefined);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleCancel();
    } else {
      setTimeout(() => setOpen(false), 50);
    }
  };

  return (
    <ModalContext.Provider value={{ alert, confirm }}>
      {children}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="sm:max-w-sm"
          onCloseAutoFocus={() => {
            setModalState(initialState);
          }}
        >
          <DialogHeader>
            <DialogTitle>{t(modalState.title)}</DialogTitle>
            <DialogDescription>{modalState.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {modalState.type === "confirm" && (
              <Button variant="outline" onClick={handleCancel}>
                {t(modalState.cancelText)}
              </Button>
            )}
            <Button onClick={handleConfirm}>{t(modalState.confirmText)}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModalContext.Provider>
  );
};
