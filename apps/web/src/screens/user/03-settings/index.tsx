"use client";
import { useTranslation } from "@/hooks/useTranslation";
import { AppearanceCard, CheckboxesCard } from "@/screens/user/ui";
import { Bell, MessageCircle } from "lucide-react";
import { useUser } from "@/providers/UserProvider";

export function Settings() {
  const { t } = useTranslation("profile");
  const { user } = useUser();
  return (
    <section className="w-full px-4 pb-4">
      <div className="flex flex-col gap-4">
        <AppearanceCard />
        <CheckboxesCard
          list={[
            {
              key: "email",
              label: t("settings.notifications.email.label"),
              desc: t("settings.notifications.email.desc"),
            },
            {
              key: "phone",
              label: t("settings.notifications.phone.label"),
              desc: t("settings.notifications.phone.desc"),
            },
          ]}
          icon={<Bell className="w-6 h-6 text-background" />}
          title={t("settings.notifications.title")}
          desc={t("settings.notifications.desc")}
        />
        {user?.role !== "admin" && (
          <CheckboxesCard
            list={[
              {
                key: "privateProfile",
                label: t("settings.privacy.privateProfile.label"),
                desc: t("settings.privacy.privateProfile.desc"),
              },
              {
                key: "noOnlineStatus",
                label: t("settings.privacy.noOnlineStatus.label"),
                desc: t("settings.privacy.noOnlineStatus.desc"),
              },
            ]}
            icon={<MessageCircle className="w-6 h-6 text-background" />}
            title={t("settings.privacy.title")}
            desc={t("settings.privacy.desc")}
          />
        )}
      </div>
    </section>
  );
}
