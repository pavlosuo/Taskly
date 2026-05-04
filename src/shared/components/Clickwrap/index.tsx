import { Tiptap } from "@/shared/components/Tiptap";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useData } from "@/providers/Data";
import { Button } from "@/components/ui/button";
import {
  useMemo,
  useRef,
  useState,
  useCallback,
  createContext,
  useContext,
  ReactNode,
} from "react";
import parse from "html-react-parser";
import SignatureCanvas from "react-signature-canvas";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldContent,
  FieldDescription,
} from "@/components/ui/field";
import { buildAgreementPdfBlob } from "@/utils/PDF";
import clsx from "clsx";

interface ClickwrapContextValue {
  open: (onConfirm: (blob: Blob) => void) => void;
}

const ClickwrapContext = createContext<ClickwrapContextValue | null>(null);

export const ClickwrapAdmin = () => {
  const { data, setData, saveData, loading } = useData();
  return (
    <div className="flex flex-col gap-4 p-5 max-w-300 mx-auto">
      <div className="flex justify-end">
        <Button
          onClick={saveData}
          className={clsx(loading && "pointer-events-none opacity-10")}
        >
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="agreement-title" className="text-md">
          Agreement Title
        </Label>
        <Input
          defaultValue={data?.policyTitle}
          onChange={(e) =>
            setData((prev) => ({ ...prev, policyTitle: e.target.value }))
          }
          id="agreement-title"
          name="agreement-title"
          type="text"
          className="w-full"
          placeholder="Enter title here..."
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-md">Agreement Content</span>
        <Tiptap />
      </div>
    </div>
  );
};

export const useClickwrap = () => {
  const ctx = useContext(ClickwrapContext);
  if (!ctx)
    throw new Error("useClickwrap must be used within ClickwrapProvider");
  return ctx;
};

export const ClickwrapProvider = ({ children }: { children: ReactNode }) => {
  const { data } = useData();
  const content = data?.policyContent;
  const parsedContent = useMemo(
    () => (content ? parse(content) : null),
    [content],
  );

  const [visible, setVisible] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [error, setError] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const signatureRef = useRef<SignatureCanvas>(null);
  const onConfirmRef = useRef<((blob: Blob) => void) | null>(null);

  const open = useCallback((onConfirm: (blob: Blob) => void) => {
    onConfirmRef.current = onConfirm;
    setIsSigned(false);
    setError(false);
    setVisible(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      setError(true);
      return;
    }
    const blob = await buildAgreementPdfBlob(contentRef, signatureRef);
    onConfirmRef.current?.(blob);
    setVisible(false);
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setError(false);
  }, []);

  const clearSignature = useCallback(() => {
    signatureRef.current?.clear();
    setIsSigned(false);
    setError(false);
  }, []);

  return (
    <ClickwrapContext.Provider value={{ open }}>
      {children}
      {visible && (
        <div
          className="fixed inset-0 z-50 bg-black/50 overflow-auto p-10 max-w-screen max-h-screen"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="flex flex-col gap-6 max-w-3xl mx-auto p-6 bg-white rounded-2xl">
            <div ref={contentRef} className="flex flex-col gap-5">
              <h2 className="text-2xl font-semibold text-gray-900 text-center">
                {data?.policyTitle}
              </h2>
              <div className="tiptap p-6">{parsedContent}</div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">
                  Signature
                </Label>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
                >
                  Clear
                </button>
              </div>
              <div
                className={clsx(
                  "relative rounded-lg border-2 border-dashed bg-gray-50 overflow-hidden transition-colors",
                  error
                    ? "border-red-400 hover:border-red-500"
                    : "border-gray-300 hover:border-gray-400",
                )}
              >
                <SignatureCanvas
                  ref={signatureRef}
                  penColor="#000000"
                  canvasProps={{
                    className: "w-full touch-none block max-w-full",
                  }}
                  onBegin={() => {
                    setIsSigned(true);
                    setError(false);
                  }}
                />
                {!isSigned && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span
                      className={clsx(
                        "text-sm select-none",
                        error ? "text-red" : "text-gray-500",
                      )}
                    >
                      Sign here with your mouse or a pen.
                    </span>
                  </div>
                )}
              </div>
              {error ? (
                <p className="text-xs text-red flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5 shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Please sign the agreement before accepting.
                </p>
              ) : (
                <p className="text-xs text-gray-400">
                  Sign the agreement with your mouse or a pen.
                </p>
              )}
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-lg border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="h-10 rounded-lg bg-[#5a6478] hover:bg-[#4a5468] text-white text-sm font-medium"
                  onClick={handleConfirm}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ClickwrapContext.Provider>
  );
};

export const ClickwrapPublic = ({
  error,
  onConfirm,
}: {
  onConfirm: (blob: Blob) => void;
  error?: boolean;
}) => {
  const { open } = useClickwrap();
  const [accepted, setAccepted] = useState(false);

  const handleClick = () => {
    if (accepted) return;
    open((blob) => {
      onConfirm(blob);
      setAccepted(true);
    });
  };

  return (
    <>
      <div className="flex justify-start w-full overflow-hidden">
        <FieldGroup className="w-full">
          <Field orientation="horizontal" data-invalid={error}>
            <Checkbox
              id="terms-checkbox"
              name="terms-checkbox"
              checked={accepted}
              onCheckedChange={handleClick}
              aria-invalid={error}
            />
            <FieldContent>
              <FieldLabel htmlFor="terms-checkbox">
                I accept the agreement
              </FieldLabel>
              <FieldDescription>
                By clicking this checkbox, you agree to the terms above.
              </FieldDescription>
            </FieldContent>
          </Field>
        </FieldGroup>
      </div>
    </>
  );
};
