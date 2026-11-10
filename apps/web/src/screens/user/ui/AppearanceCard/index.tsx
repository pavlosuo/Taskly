"use client";
import { useTranslation } from "@/hooks/useTranslation";
import { Globe } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LANGS } from "shared/data";
import { useTheme } from "@/providers/ThemeProvider";
import { SectionCard } from "@/screens/user/ui";

export function AppearanceCard() {
  const { t } = useTranslation(["profile", "common"]);
  const { lang, changeTheme, theme, changeLang } = useTheme();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 items-start">
      <SectionCard
        icon={<Globe className="w-6 h-6 text-background" />}
        title={t("appearance.title")}
        desc={t("appearance.desc")}
      />
      <div className="border border-border bg-background p-4 flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-0.5">
              {t("appearance.language.label")}
            </p>
            <p className="text-xs text-grey">{t("appearance.language.desc")}</p>
          </div>
          <Select value={lang} onValueChange={changeLang}>
            <SelectTrigger className="w-36 h-9 text-sm relative">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background">
              {LANGS.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {t(`common:${l.label}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-0.5">
              {t("appearance.darkMode.label")}
            </p>
            <p className="text-xs text-grey">{t("appearance.darkMode.desc")}</p>
          </div>
          <Switch
            aria-label={t("appearance.darkMode.label")}
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
