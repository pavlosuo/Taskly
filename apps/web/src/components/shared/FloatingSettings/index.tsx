"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Settings, Globe, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LANGS } from "shared/data";
import { useTheme } from "@/providers/ThemeProvider";

export function FloatingSettings() {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const { lang, theme, changeLang, changeTheme } = useTheme();
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 h-10 w-10 rounded-full border-border bg-background shadow-md transition-all hover:scale-105"
        aria-label={t("settings.title")}
      >
        <Settings aria-hidden="true" className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("settings.title")}</DialogTitle>
            <DialogDescription>{t("settings.description")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <Globe
                    aria-hidden="true"
                    className="h-4 w-4 text-foreground"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t("settings.language.title")}
                  </p>
                  <p className="text-xs text-grey">
                    {t("settings.language.description")}
                  </p>
                </div>
              </div>
              <Select value={lang} onValueChange={changeLang}>
                <SelectTrigger
                  aria-label={t("settings.language.title")}
                  className="w-32 h-9 text-sm"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {LANGS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {t(item.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <Moon
                    aria-hidden="true"
                    className="h-4 w-4 text-foreground"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t("settings.darkMode.title")}
                  </p>
                  <p className="text-xs text-grey">
                    {t("settings.darkMode.description")}
                  </p>
                </div>
              </div>
              <Switch
                aria-label={t("settings.darkMode.title")}
                checked={theme === "dark"}
                onCheckedChange={(checked) =>
                  changeTheme(checked ? "dark" : "light")
                }
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
