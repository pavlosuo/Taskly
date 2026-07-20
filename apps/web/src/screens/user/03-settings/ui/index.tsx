"use client";
import { Globe, Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionCard } from "@/screens/user/01-account/ui";
import { useUser } from "@/providers/User";
import { getAxiosError } from "@/utils/getAxiosError";
import { useState } from "react";
import { langs } from "@shared/data";
import { useTheme } from "@/providers/Theme";

const rows = [
  {
    key: "email",
    label: "Email notifications",
    desc: "Receive updates via email.",
  },
];

export function AppearanceCard() {
  const { user } = useUser();
  const { lang, changeTheme, theme, changeLang } = useTheme();
  if (!user) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 items-start">
      <SectionCard
        icon={<Globe className="w-6 h-6 text-background" />}
        title="Appearance"
        desc="Choose your language and display theme."
      />
      <div className="rounded-xl border border-border bg-background p-4 flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-0.5">
              Language
            </p>
            <p className="text-xs text-grey">
              Choose the app display language.
            </p>
          </div>
          <Select value={lang} onValueChange={changeLang}>
            <SelectTrigger className="w-36 h-9 rounded-lg text-sm relative">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background">
              {langs.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-0.5">
              Dark mode
            </p>
            <p className="text-xs text-grey">
              Switch between light and dark theme.
            </p>
          </div>
          <Switch
            checked={theme === "dark"}
            onCheckedChange={(checked) =>
              changeTheme(checked ? "dark" : "light")
            }
          />
        </div>
      </div>
    </div>
  );
}

export function NotificationsCard() {
  const { user, updateProfile } = useUser();
  const [error, setError] = useState("");

  const toggle = async (key: string, value: boolean) => {
    try {
      await updateProfile({
        settings: {
          ...user?.settings,
          notifications: {
            ...user?.settings?.notifications,
            [key]: value,
          },
        },
      });
    } catch (e) {
      setError(getAxiosError(e));
    }
  };

  if (!user) return null;

  const notifications = user.settings?.notifications;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 items-start">
      <SectionCard
        icon={<Bell className="w-6 h-6 text-background" />}
        title="Notifications"
        desc="Choose what you want to be notified about."
      />
      <div className="rounded-xl border border-border bg-background p-4 flex flex-col gap-4">
        {rows.map((row, i) => (
          <div key={row.key}>
            {i > 0 && <div className="h-px bg-border mb-4" />}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground mb-0.5">
                  {row.label}
                </p>
                <p className="text-xs text-grey">{row.desc}</p>
              </div>
              <Switch
                checked={
                  notifications?.[row.key as keyof typeof notifications] ?? true
                }
                onCheckedChange={(v) => toggle(row.key, v)}
              />
            </div>
          </div>
        ))}
        {error && <p className="text-xs text-red mt-1">{error}</p>}
      </div>
    </div>
  );
}
