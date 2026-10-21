"use client";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useRef, useEffect } from "react";
import { useUser } from "@/providers/UserProvider";
import clsx from "clsx";

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
const COUNTDOWN_DURATION_S = 60;
const TOTAL_MS = INACTIVITY_TIMEOUT_MS + COUNTDOWN_DURATION_S * 1000;
const TICK_MS = 1000;
const ACTIVITY_WRITE_THROTTLE_MS = 1000;
const STORAGE_KEY = "auto-logout";

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "wheel",
  "click",
];

function readLastActivity(fallback: number): number {
  try {
    const value = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  } catch {
    return fallback;
  }
}

function writeLastActivity(value: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {}
}

export function AutoLogoutPopup() {
  const { t } = useTranslation("common");
  const { logout } = useUser();
  const [countdown, setCountdown] = useState<number | null>(null);
  const lastActivityRef = useRef<number>(new Date().getTime());
  const popupOpenRef = useRef(false);
  const loggedOutRef = useRef(false);
  const logoutRef = useRef(logout);

  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const shown = countdown ?? COUNTDOWN_DURATION_S;
  const strokeDashoffset = circumference * (1 - shown / COUNTDOWN_DURATION_S);
  const isDanger = shown <= 10;

  const markActivity = useCallback((force = false) => {
    const now = new Date().getTime();
    if (!force && now - lastActivityRef.current < ACTIVITY_WRITE_THROTTLE_MS) {
      return;
    }
    lastActivityRef.current = now;
    writeLastActivity(now);
    popupOpenRef.current = false;
    setCountdown(null);
  }, []);

  const check = useCallback(() => {
    if (loggedOutRef.current) return;
    const last = readLastActivity(lastActivityRef.current);
    lastActivityRef.current = last;
    const idle = new Date().getTime() - last;
    if (idle >= TOTAL_MS) {
      loggedOutRef.current = true;
      popupOpenRef.current = false;
      setCountdown(null);
      logoutRef.current();
      return;
    }
    if (idle >= INACTIVITY_TIMEOUT_MS) {
      const remaining = Math.min(
        COUNTDOWN_DURATION_S,
        Math.max(1, Math.ceil((TOTAL_MS - idle) / 1000)),
      );
      popupOpenRef.current = true;
      setCountdown(remaining);
    } else if (popupOpenRef.current) {
      popupOpenRef.current = false;
      setCountdown(null);
    }
  }, []);

  const doLogout = useCallback(() => {
    if (loggedOutRef.current) return;
    loggedOutRef.current = true;
    popupOpenRef.current = false;
    logoutRef.current();
    setCountdown(null);
  }, []);

  useEffect(() => {
    loggedOutRef.current = false;
    markActivity(true);
    check();

    const interval = setInterval(check, TICK_MS);

    const handleActivity = () => {
      if (popupOpenRef.current) return;
      markActivity();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) check();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") check();
    };

    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, handleActivity),
    );
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", check);
    window.addEventListener("pageshow", check);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) =>
        window.removeEventListener(evt, handleActivity),
      );
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", check);
      window.removeEventListener("pageshow", check);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
    };
  }, [check, markActivity]);

  return (
    <Dialog
      open={countdown !== null}
      onOpenChange={(open) => !open && markActivity()}
    >
      <DialogContent
        className="sm:max-w-100 gap-0 p-0 overflow-hidden"
        onInteractOutside={(e) => {
          e.preventDefault();
          markActivity();
        }}
      >
        <div className="flex flex-col items-center px-8 pt-8 pb-6 gap-4">
          <div className="relative w-18 h-18 shrink-0">
            <svg
              width="72"
              height="72"
              className="-rotate-90"
              aria-hidden="true"
            >
              <circle
                cx="36"
                cy="36"
                r={radius}
                fill="none"
                className="stroke-muted"
                strokeWidth="5"
              />
              <circle
                cx="36"
                cy="36"
                r={radius}
                fill="none"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={clsx(
                  "transition-colors",
                  isDanger ? "stroke-destructive" : "stroke-primary",
                )}
                style={{
                  transition: "stroke-dashoffset 1s linear, stroke 0.3s ease",
                }}
              />
            </svg>
            <span
              className={clsx(
                "absolute inset-0 flex items-center justify-center text-xl font-bold tabular-nums transition-colors",
                isDanger ? "text-destructive" : "text-foreground",
              )}
            >
              {shown}
            </span>
          </div>
          <DialogHeader className="items-center text-center space-y-1">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-foreground" aria-hidden />
              <DialogTitle className="text-foreground">
                {t("popup.title")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm">
              {t("popup.logoutIn")}{" "}
              <span
                className={clsx(
                  "font-semibold transition-colors",
                  isDanger ? "text-destructive" : "text-foreground",
                )}
              >
                {t("popup.seconds", { count: shown })}
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="w-full flex-row gap-3 sm:space-x-0">
            <Button onClick={() => markActivity()} className="flex-1">
              {t("popup.continue")}
            </Button>
            <Button
              variant="outline"
              onClick={doLogout}
              className="flex-1 hover:border-destructive hover:text-destructive transition-colors"
            >
              {t("popup.logout")}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
