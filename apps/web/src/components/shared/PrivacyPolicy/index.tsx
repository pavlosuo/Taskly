import { Tiptap } from "@/components/shared/Tiptap";
import { Input } from "@/components/shared/Input";
import { Label } from "@/components/ui/label";
import { usePolicyData } from "@/providers/PolicyDataProvider";
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
import { useTranslation, Trans } from "react-i18next";
import { useState } from "react";
import { LANGS, Lang } from "shared/index";

export const PrivacyPolicyAdmin = () => {
  const { t } = useTranslation(["common", "policy"]);
  const { policyData, setPolicyData, savePolicyData, loading } =
    usePolicyData();
  const [lang, setLang] = useState<Lang>(LANGS[0].value as Lang);
  const current = policyData?.translations?.[lang];

  const updateCurrent = (
    patch: Partial<{ policyTitle: string; policyContent: string }>,
  ) =>
    setPolicyData((prev) => ({
      ...prev,
      translations: {
        ...prev?.translations,
        [lang]: { ...prev?.translations?.[lang], ...patch },
      },
    }));

  return (
    <div className="flex flex-col gap-4 w-full">
      <div role="tablist" className="flex gap-1">
        {LANGS.map((l) => (
          <button
            key={l.value}
            type="button"
            role="tab"
            aria-selected={lang === l.value}
            onClick={() => setLang(l.value as Lang)}
            className={clsx(
              "h-8 px-3 rounded-md text-sm font-medium transition-colors",
              lang === l.value
                ? "bg-primary text-white hover:bg-primary/90"
                : "text-grey hover:text-foreground hover:bg-muted",
            )}
          >
            {t(l.label)}
          </button>
        ))}
      </div>
      <div className="w-full grid grid-cols-[1fr_max-content] gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="privacy-policy-title" className="text-md">
            {t("policy:privacyPolicyTitle")}
          </Label>
          <Input
            value={current?.policyTitle ?? ""}
            onChange={(e) => updateCurrent({ policyTitle: e.target.value })}
            name="privacy-policy-title"
            type="text"
            className="w-full"
            placeholder="Enter title here..."
          />
          <span className="text-md">{t("policy:privacyPolicyContent")}</span>
          <Tiptap
            key={lang}
            value={current?.policyContent || ""}
            onUpdate={({ editor }) =>
              updateCurrent({ policyContent: editor.getHTML() })
            }
          />
        </div>
        <div className="h-full w-full relative">
          <Button
            onClick={savePolicyData}
            className={clsx("sticky top-0 w-20")}
            disabled={loading}
          >
            {loading ? t("loading") : t("actions.save")}
          </Button>
        </div>
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
  const { t } = useTranslation("common");
  return (
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
              {t("privacy.accept")}
            </FieldLabel>
            <FieldDescription>
              <Trans
                i18nKey="privacy.description"
                ns="common"
                components={{
                  policy: (
                    <Link
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-primary"
                      href="/privacy"
                    />
                  ),
                }}
              />
            </FieldDescription>
          </FieldContent>
        </Field>
      </FieldGroup>
    </div>
  );
};
