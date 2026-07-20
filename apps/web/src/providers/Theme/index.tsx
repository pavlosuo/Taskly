import { createContext, useContext, useState, ReactNode } from "react";
import { Lang, Theme, PublicUser } from "@shared/types";
import i18n from "i18next";
import "@/i18n";
import { axiosApi } from "@/lib/api";

interface ThemeContextType {
  lang: Lang;
  changeTheme: (theme: Theme) => void;
  theme: Theme;
  changeLang: (lang: Lang) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};

export const ThemeProvider: React.FC<{
  initialUser?: PublicUser | null;
  children: ReactNode;
}> = ({ children, initialUser }) => {
  const [lang, setLang] = useState<Lang>(initialUser?.settings?.lang ?? "en");
  const [theme, setTheme] = useState<Theme>(
    initialUser?.settings?.theme ?? "light",
  );

  const changeTheme = (newTheme: Theme) => {
    document.documentElement.dataset.theme = newTheme;
    setTheme(newTheme);
    axiosApi
      .updateProfile({ settings: { lang, theme: newTheme } })
      .catch(console.error);
  };

  const changeLang = (newLang: Lang) => {
    i18n.changeLanguage(newLang, (err) => {
      if (err) return;
      document.documentElement.lang = newLang;
      setLang(newLang);
      axiosApi
        .updateProfile({ settings: { lang: newLang, theme } })
        .catch(console.error);
    });
  };

  return (
    <ThemeContext.Provider value={{ lang, theme, changeTheme, changeLang }}>
      {children}
    </ThemeContext.Provider>
  );
};
