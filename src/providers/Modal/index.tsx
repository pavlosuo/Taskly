import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Button } from "@/components/ui/button";

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
    | ((value: boolean | undefined | null | PromiseLike<boolean>) => void)
    | null;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error("useModal must be used within ModalProvider");
  return context;
};

export const ModalProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [modalState, setModalState] = useState<ModalState>({
    type: null,
    title: "",
    message: "",
    confirmText: "OK",
    cancelText: "Cancel",
    resolve: null,
  });

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
          setModalState((prev) => ({ ...prev, type: null, resolve: null }));
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
            setModalState((prev) => ({ ...prev, type: null, resolve: null }));
          },
        });
      });
    },
    [],
  );

  const handleConfirm = () => modalState.resolve?.(true);

  const handleCancel = () =>
    modalState.resolve?.(modalState.type === "confirm" ? false : undefined);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) handleCancel();
  };

  return (
    <ModalContext.Provider value={{ alert, confirm }}>
      {children}
      {modalState.type && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-6 pt-6 pb-2">
              <h3 className="text-base font-semibold text-foreground">
                {modalState.title}
              </h3>
            </div>
            <div className="px-6 py-3">
              <p className="text-sm text-gray leading-relaxed">
                {modalState.message}
              </p>
            </div>
            <div className="flex gap-2 px-6 pb-6 pt-2">
              {modalState.type === "confirm" && (
                <Button
                  variant="outline"
                  className="flex-1 h-10 rounded-lg border-border text-sm font-medium text-grey hover:bg-gray-50"
                  onClick={handleCancel}
                >
                  {modalState.cancelText}
                </Button>
              )}
              <Button
                className="flex-1 h-10 rounded-lg bg-[#5a6478] hover:bg-[#4a5468] text-white text-sm font-medium"
                onClick={handleConfirm}
              >
                {modalState.confirmText}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};
