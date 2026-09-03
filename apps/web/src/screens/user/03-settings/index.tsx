"use client";
import { AppearanceCard, CheckboxesCard } from "@/screens/user/ui";
import { Bell, MessageCircle } from "lucide-react";
import { useUser } from "@/providers/UserProvider";

export function Settings() {
  const { user } = useUser();
  return (
    <section className="w-full px-4">
      <div className="flex flex-col gap-4">
        <AppearanceCard />
        <CheckboxesCard
          list={[
            {
              key: "email",
              label: "Email notifications",
              desc: "Receive updates via email.",
            },
            {
              key: "phone",
              label: "SMS notifications",
              desc: "Receive updates via sms.",
            },
          ]}
          icon={<Bell className="w-6 h-6 text-background" />}
          title="Notifications"
          desc="Receive updates via messages."
        />
        {user?.role !== "admin" && (
          <CheckboxesCard
            list={[
              {
                key: "privateProfile",
                label: "Private profile",
                desc: "Keep your profile private.",
              },
              {
                key: "noOnlineStatus",
                label: "Online status",
                desc: "Hide your online status.",
              },
            ]}
            icon={<MessageCircle className="w-6 h-6 text-background" />}
            title="Privacy"
            desc="Keep your profile private."
          />
        )}
      </div>
    </section>
  );
}
