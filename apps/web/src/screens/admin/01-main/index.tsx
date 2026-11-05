"use client";
import { PrivacyPolicyAdmin } from "@/components/shared/PrivacyPolicy";
import { SectionCard } from "@/screens/user/ui";
import { GlobeLock } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Main() {
  const { t } = useTranslation("admin");
  return (
    <section className="w-full px-4">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 items-start">
          <SectionCard
            icon={<GlobeLock className="w-6 h-6 text-background" />}
            title={t("title")}
            desc={t("description")}
          />
          <PrivacyPolicyAdmin />
        </div>
      </div>
    </section>
  );
}
