import { Tiptap } from "@/shared/components/Tiptap";
import { Input } from "@/components/ui/input";
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
    </div>
  );
};

export const ClickwrapPublic = ({
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
      <div className="flex justify-start w-full overflow-hidden">
        <FieldGroup className="w-full">
          <Field orientation="horizontal" data-invalid={error}>
            <Checkbox
              id="terms-checkbox"
              name="terms-checkbox"
              checked={accepted}
              onCheckedChange={() => setAccepted(!accepted)}
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
