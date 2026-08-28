"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { Lang, Theme } from "@shared/types";
import i18n from "i18next";
import "@/i18n";
import { axiosApi } from "@/lib/api";
import { useUser } from "@/providers/UserProvider";

interface ThemeContextType {
  lang: Lang;
  changeTheme: (theme: Theme) => void;
  theme: Theme;
  changeLang: (lang: Lang) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

const CHANNEL_NAME = "theme-sync";

type SyncMessage =
  | {
      type: "theme";
      value: Theme;
    }
  | {
      type: "lang";
      value: Lang;
    };

interface ThemeProviderProps {
  initialTheme: Theme;
  initialLang: Lang;
  children: ReactNode;
}

export const ThemeProvider = ({
  children,
  initialTheme,
  initialLang,
}: ThemeProviderProps) => {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const { user } = useUser();

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent<SyncMessage>) => {
      const message = event.data;

      if (message.type === "theme") {
        setTheme(message.value);
        document.documentElement.dataset.theme = message.value;
        return;
      }

      if (message.type === "lang") {
        i18n.changeLanguage(message.value, (err) => {
          if (err) {
            console.error(err);
            return;
          }
          document.documentElement.lang = message.value;
          setLang(message.value);
        });
      }
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  // useEffect(() => {
  //   i18n.changeLanguage(lang).catch(console.error);
  // }, []);

  const saveGuestPreferences = async (preferences: {
    theme?: Theme;
    lang?: Lang;
  }) => {
    if (user) {
      return;
    }
    try {
      await axiosApi.preferences(preferences);
    } catch {}
  };

  const broadcast = (message: SyncMessage) => {
    channelRef.current?.postMessage(message);
  };

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    document.documentElement.dataset.theme = newTheme;
    if (!user) {
      saveGuestPreferences({
        theme: newTheme,
      });
    }
    if (user) {
      axiosApi
        .updateProfile({
          settings: {
            lang,
            theme: newTheme,
          },
        })
        .catch(console.error);
    }
    broadcast({
      type: "theme",
      value: newTheme,
    });
  };

  const changeLang = (newLang: Lang) => {
    i18n.changeLanguage(newLang, (err) => {
      if (err) {
        console.error(err);
        return;
      }
      setLang(newLang);
      document.documentElement.lang = newLang;
      if (!user) {
        saveGuestPreferences({
          lang: newLang,
        });
      }
      if (user) {
        axiosApi
          .updateProfile({
            settings: {
              lang: newLang,
              theme,
            },
          })
          .catch(console.error);
      }
      broadcast({
        type: "lang",
        value: newLang,
      });
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        lang,
        theme,
        changeTheme,
        changeLang,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
