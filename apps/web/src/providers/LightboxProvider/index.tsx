"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { Lightbox } from "@/shared/components/Lightbox";
import { MediaItemPublic } from "@shared/types";

interface LightboxContextType {
  setLightbox: (items: { items: MediaItemPublic[]; index: number }) => void;
}

const LightboxContext = createContext<LightboxContextType | null>(null);

export const useLightbox = () => {
  const ctx = useContext(LightboxContext);
  if (!ctx) throw new Error("useLightbox must be used within LightboxProvider");
  return ctx;
};

export const LightboxProvider = ({ children }: { children: ReactNode }) => {
  const [lightbox, setLightbox] = useState<{
    items: MediaItemPublic[];
    index: number;
  } | null>(null);
  return (
    <LightboxContext.Provider value={{ setLightbox }}>
      {children}
      {lightbox && (
        <Lightbox
          items={lightbox.items}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndexChange={(i) =>
            setLightbox({ items: lightbox.items, index: i })
          }
        />
      )}
    </LightboxContext.Provider>
  );
};
