"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { Lang, Theme, PAGES_META, APP_NAME } from "shared/index";
import i18n from "i18next";
import "@/i18n";
import { axiosApi } from "@/api/index";
import { useUser } from "@/providers/UserProvider";
import { usePathname } from "next/navigation";

interface ThemeContextType {
  lang: Lang;
  theme: Theme;
  changeTheme: (theme: Theme) => void;
  changeLang: (lang: Lang) => void;
}

type SyncMessage =
  { type: "theme"; value: Theme } | { type: "lang"; value: Lang };

interface ThemeProviderProps {
  initialTheme: Theme;
  initialLang: Lang;
  children: ReactNode;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const CHANNEL_NAME = "theme-sync";

function isSyncMessage(data: unknown): data is SyncMessage {
  if (typeof data !== "object" || data === null) return false;
  const msg = data as Record<string, unknown>;
  return (
    (msg.type === "theme" || msg.type === "lang") &&
    typeof msg.value === "string"
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({
  children,
  initialTheme,
  initialLang,
}: ThemeProviderProps) => {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const { user } = useUser();
  const stateRef = useRef({ lang, theme });
  const pathname = usePathname();
  const pageId = pathname.split("/").filter(Boolean).at(-1) ?? "";

  useEffect(() => {
    stateRef.current = { lang, theme };
  }, [lang, theme]);

  useEffect(() => {
    const meta = PAGES_META[pageId]?.[lang];
    if (!meta) return;
    document.title = meta.title + " | " + APP_NAME;
  }, [pageId, lang]);

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent<unknown>) => {
      if (!isSyncMessage(event.data)) return;
      const message = event.data;
      if (message.type === "theme") {
        setTheme(message.value);
        document.documentElement.dataset.theme = message.value;
        return;
      }
      i18n.changeLanguage(message.value, (err) => {
        if (err) {
          console.error("Failed to sync language:", err);
          return;
        }
        document.documentElement.lang = message.value;
        setLang(message.value);
      });
    };
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  const broadcast = useCallback((message: SyncMessage) => {
    channelRef.current?.postMessage(message);
  }, []);

  const persistPreferences = useCallback(
    async (next: { lang?: Lang; theme?: Theme }) => {
      try {
        if (!user) {
          await axiosApi.preferences(next);
          return;
        }
        await axiosApi.updateProfile({
          settings: {
            lang: next.lang ?? stateRef.current.lang,
            theme: next.theme ?? stateRef.current.theme,
          },
        });
      } catch (err) {
        console.error("Failed to save preferences:", err);
      }
    },
    [user],
  );

  const changeTheme = useCallback(
    (newTheme: Theme) => {
      setTheme(newTheme);
      document.documentElement.dataset.theme = newTheme;
      persistPreferences({ theme: newTheme });
      broadcast({ type: "theme", value: newTheme });
    },
    [persistPreferences, broadcast],
  );

  const changeLang = useCallback(
    (newLang: Lang) => {
      i18n.changeLanguage(newLang, (err) => {
        if (err) {
          console.error("Failed to change language:", err);
          return;
        }
        setLang(newLang);
        document.documentElement.lang = newLang;
        persistPreferences({ lang: newLang });
        broadcast({ type: "lang", value: newLang });
      });
    },
    [persistPreferences, broadcast],
  );

  const value = useMemo(
    () => ({ lang, theme, changeTheme, changeLang }),
    [lang, theme, changeTheme, changeLang],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
