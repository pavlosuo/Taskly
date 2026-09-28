"use client";
import { useState } from "react";
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
import { LANGS } from "@shared/data";
import { useTheme } from "@/providers/ThemeProvider";

export function FloatingSettings() {
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
        aria-label="Settings"
      >
        <Settings className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Customize your language and display theme.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <Globe className="h-4 w-4 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Language
                  </p>
                  <p className="text-xs text-grey">Choose the app language.</p>
                </div>
              </div>
              <Select value={lang} onValueChange={changeLang}>
                <SelectTrigger className="w-32 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {LANGS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <Moon className="h-4 w-4 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Dark mode
                  </p>
                  <p className="text-xs text-grey">
                    Switch between light and dark theme.
                  </p>
                </div>
              </div>
              <Switch
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
