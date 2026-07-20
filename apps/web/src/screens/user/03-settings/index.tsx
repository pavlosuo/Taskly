"use client";
import {
  AppearanceCard,
  NotificationsCard,
} from "@/screens/user/03-settings/ui";

export function Settings() {
  return (
    <section className="w-full px-4">
      <div className="flex flex-col gap-4">
        <AppearanceCard />
        <NotificationsCard />
      </div>
    </section>
  );
}
