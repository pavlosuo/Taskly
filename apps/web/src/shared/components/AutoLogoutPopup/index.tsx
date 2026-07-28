"use client";

import { AlertTriangle } from "lucide-react";
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

const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000;
const COUNTDOWN_DURATION_S = 60;

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "wheel",
  "click",
];

export function AutoLogoutPopup() {
  const { logout } = useUser();
  const [showPopup, setShowPopup] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION_S);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const countdownRef = useRef(countdown);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference * (1 - countdown / COUNTDOWN_DURATION_S);
  const isDanger = countdown <= 10;

  const clearCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  const doLogout = useCallback(() => {
    clearCountdown();
    clearInactivityTimer();
    setShowPopup(false);
    logout();
  }, [clearCountdown, clearInactivityTimer, logout]);

  const startCountdown = useCallback(() => {
    setShowPopup(true);
    const fn = () => {
      setCountdown((countdown) => countdown - 1);
      if (countdownRef.current <= 0) {
        clearCountdown();
        doLogout();
      }
    };
    fn();
    countdownIntervalRef.current = setInterval(fn, 1000);
  }, [clearCountdown, doLogout]);

  const resetInactivityTimer = useCallback(() => {
    if (showPopup) {
      clearCountdown();
      setShowPopup(false);
      setCountdown(COUNTDOWN_DURATION_S);
    }
    clearInactivityTimer();
    inactivityTimerRef.current = setTimeout(() => {
      startCountdown();
    }, INACTIVITY_TIMEOUT_MS);
  }, [showPopup, clearCountdown, clearInactivityTimer, startCountdown]);

  const handleStay = useCallback(() => {
    clearCountdown();
    setShowPopup(false);
    resetInactivityTimer();
  }, [clearCountdown, resetInactivityTimer]);

  useEffect(() => {
    const handleActivity = () => {
      if (showPopup) return;
      resetInactivityTimer();
    };
    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, handleActivity, { passive: true }),
    );
    return () => {
      ACTIVITY_EVENTS.forEach((evt) =>
        window.removeEventListener(evt, handleActivity),
      );
      clearInactivityTimer();
      clearCountdown();
      resetInactivityTimer();
    };
  }, [clearCountdown, resetInactivityTimer, clearInactivityTimer, showPopup]);

  useEffect(() => {
    countdownRef.current = countdown;
  }, [countdown]);

  return (
    <Dialog open={showPopup} onOpenChange={(open) => !open && handleStay()}>
      <DialogContent
        className="ssm:max-w-100 gap-0 p-0 overflow-hidden"
        onInteractOutside={(e) => {
          e.preventDefault();
          handleStay();
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
              {countdown}
            </span>
          </div>
          <DialogHeader className="items-center text-center space-y-1">
            <div className="flex items-center gap-1.5">
              <AlertTriangle
                className={clsx(
                  "w-4 h-4 transition-colors text-muted-foreground",
                )}
              />
              <DialogTitle className="text-base">
                Are you still there?
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm">
              You will be logged out in{" "}
              <span
                className={clsx(
                  "font-semibold transition-colors",
                  isDanger ? "text-destructive" : "text-foreground",
                )}
              >
                {countdown} seconds.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="w-full flex-row gap-3 sm:space-x-0">
            <Button onClick={handleStay} className="flex-1">
              Continue
            </Button>
            <Button
              variant="outline"
              onClick={doLogout}
              className="flex-1 hover:border-destructive hover:text-destructive transition-colors"
            >
              Logout
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
