"use client";
import { useTranslation } from "@/hooks/useTranslation";
import { PolicyData } from "shared/types";
import parseSafeHtml from "@/utils/parseSafeHtml";
import { useFormatDate } from "@/hooks/useFormatDate";
import { useTheme } from "@/providers/ThemeProvider";
import { PublicHeader } from "@/components/shared/PublicHeader";

export const Main = ({ data }: { data: PolicyData }) => {
  const { t } = useTranslation("policy");
  const date = useFormatDate(data.updatedAt);
  const { lang } = useTheme();
  const content = data.translations[lang] ?? data.translations.en;
  return (
    <>
      <PublicHeader />
      <main className="page">
        <section className="w-full px-4 py-20">
          <div className="max-w-3xl m-auto">
            <div className="flex flex-col justify-center gap-2 mb-6">
              <h1 className="text-3xl font-bold text-center">
                {content?.policyTitle}
              </h1>
              {data.updatedAt && (
                <p className="text-sm text-center">
                  {t("lastUpdated", { date })}
                </p>
              )}
            </div>
            <div className="text-wrapper">
              {content?.policyContent && parseSafeHtml(content.policyContent)}
            </div>
          </div>
        </section>
      </main>
    </>
  );
};
