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
  startTransition,
} from "react";
import { Lang, Theme, PAGES_META, APP_NAME } from "shared/index";
import { I18nextProvider } from "react-i18next";
import { createI18n } from "@/i18n";
import { axiosApi } from "@/api/index";
import { useUser } from "@/providers/UserProvider";
import { usePathname } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { getAxiosError } from "@/utils/getAxiosError";

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
  const toast = useToast();
  const { user } = useUser();
  const pathname = usePathname();
  const [i18nInstance] = useState(() => createI18n(initialLang));
  const [lang, setLang] = useState<Lang>(initialLang);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const stateRef = useRef({ lang: initialLang, theme: initialTheme });
  const pageId = pathname.split("/").filter(Boolean).at(-1) ?? "";

  useEffect(() => {
    if (i18nInstance.language !== initialLang) {
      i18nInstance.changeLanguage(initialLang);
      startTransition(() => setLang(initialLang));
    }
  }, [initialLang, i18nInstance]);

  useEffect(() => {
    stateRef.current = { lang, theme };
  }, [lang, theme]);

  useEffect(() => {
    const meta = PAGES_META[pageId]?.[lang];

    if (meta) {
      document.title = `${meta.title} | ${APP_NAME}`;
    }

    document.documentElement.lang = lang;
  }, [pageId, lang]);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;

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

      i18nInstance.changeLanguage(message.value, (err) => {
        if (err) {
          toast("errors:changeLang");
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
  }, [toast, i18nInstance]);

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
      } catch (e) {
        toast(getAxiosError(e));
      }
    },
    [user, toast],
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
      if (newLang === lang) return;

      i18nInstance.changeLanguage(newLang, (err) => {
        if (err) {
          toast("errors:changeLang");
          return;
        }

        setLang(newLang);
        document.documentElement.lang = newLang;

        persistPreferences({ lang: newLang });
        broadcast({ type: "lang", value: newLang });
      });
    },
    [lang, persistPreferences, broadcast, toast, i18nInstance],
  );

  const value = useMemo(
    () => ({
      lang,
      theme,
      changeTheme,
      changeLang,
    }),
    [lang, theme, changeTheme, changeLang],
  );

  return (
    <ThemeContext.Provider value={value}>
      <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>
    </ThemeContext.Provider>
  );
};
