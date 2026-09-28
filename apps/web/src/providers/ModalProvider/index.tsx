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
  confirmText: "OK",
  cancelText: "Cancel",
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

  const alert = useCallback((options: AlertOptions | string): Promise<void> => {
    return new Promise((resolve) => {
      const opts = typeof options === "string" ? { message: options } : options;
      setModalState({
        type: "alert",
        title: opts.title || "Alert",
        message: opts.message,
        confirmText: opts.confirmText || "OK",
        cancelText: "",
        resolve: () => {
          resolve();
          setModalState(initialState);
        },
      });
    });
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions | string): Promise<boolean> => {
      return new Promise((resolve) => {
        const opts =
          typeof options === "string" ? { message: options } : options;
        setModalState({
          type: "confirm",
          title: opts.title || "Confirm",
          message: opts.message,
          confirmText: opts.confirmText || "OK",
          cancelText: opts.cancelText || "Cancel",
          resolve: (value) => {
            resolve(value as boolean | PromiseLike<boolean>);
            setModalState(initialState);
          },
        });
      });
    },
    [],
  );

  const handleConfirm = () => modalState.resolve?.(true);

  const handleCancel = () =>
    modalState.resolve?.(modalState.type === "confirm" ? false : undefined);

  const handleOpenChange = (open: boolean) => {
    if (!open) handleCancel();
  };

  return (
    <ModalContext.Provider value={{ alert, confirm }}>
      {children}
      <Dialog open={!!modalState.type} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{modalState.title}</DialogTitle>
            <DialogDescription>{modalState.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {modalState.type === "confirm" && (
              <Button variant="outline" onClick={handleCancel}>
                {modalState.cancelText}
              </Button>
            )}
            <Button onClick={handleConfirm}>{modalState.confirmText}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModalContext.Provider>
  );
};
