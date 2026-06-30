import { createContext, useContext, useState, ReactNode } from "react";
import { Lang, Theme } from "@shared/types";
import "@/i18n";

interface ThemeContextType {
  lang: Lang;
  setLang: React.Dispatch<React.SetStateAction<Lang>>;
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};

export const ThemeProvider: React.FC<{
  children: ReactNode;
  langInitial?: Lang;
  themeInitial?: Theme;
}> = ({ children, langInitial, themeInitial }) => {
  const [lang, setLang] = useState<Lang>(langInitial || "en");
  const [theme, setTheme] = useState<Theme>(themeInitial || "light");
  return (
    <ThemeContext.Provider value={{ lang, setLang, theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
