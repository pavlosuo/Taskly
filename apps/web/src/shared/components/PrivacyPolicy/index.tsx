import { Tiptap } from "@/shared/components/Tiptap";
import { Input } from "@/shared/components/Input";
import { Label } from "@/components/ui/label";
import { useData } from "@/providers/PolicyDataProvider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldContent,
  FieldDescription,
} from "@/components/ui/field";
import clsx from "clsx";
import Link from "next/link";

export const PrivacyPolicyAdmin = () => {
  const { data, setData, saveData, loading } = useData();
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-2">
        <Label htmlFor="privacy-policy-title" className="text-md">
          Privacy policy title
        </Label>
        <Input
          value={data?.policyTitle}
          onChange={(e) =>
            setData((prev) => ({ ...prev, policyTitle: e.target.value }))
          }
          name="privacy-policy-title"
          type="text"
          className="w-full"
          placeholder="Enter title here..."
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-md">Privacy policy content</span>
        <Tiptap
          value={data?.policyContent || ""}
          onUpdate={({ editor }) => {
            setData((prev) => ({
              ...prev,
              policyContent: editor.getHTML(),
            }));
          }}
        />
      </div>
      <div className="flex justify-end">
        <Button
          onClick={saveData}
          className={clsx(loading && "pointer-events-none opacity-10")}
        >
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
};

export const PrivacyPolicyPublic = ({
  error,
  accepted,
  setAccepted,
}: {
  error: boolean;
  accepted: boolean;
  setAccepted: (accepted: boolean) => void;
}) => {
  return (
    <>
      <div className="flex justify-start w-full overflow-hidden col-span-full p-1">
        <FieldGroup className="w-full">
          <Field orientation="horizontal" data-invalid={error}>
            <Checkbox
              id="policy-checkbox"
              name="policy-checkbox"
              checked={accepted}
              onCheckedChange={() => setAccepted(!accepted)}
              aria-invalid={error}
            />
            <FieldContent>
              <FieldLabel htmlFor="policy-checkbox">
                I accept the privacy policy
              </FieldLabel>
              <FieldDescription>
                By clicking this checkbox, you agree to the{" "}
                <Link
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-primary"
                  href="/privacy"
                >
                  privacy policy
                </Link>
              </FieldDescription>
            </FieldContent>
          </Field>
        </FieldGroup>
      </div>
    </>
  );
};
