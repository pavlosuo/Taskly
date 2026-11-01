"use client";
import { Beams } from "@/components/shared/Beams";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/providers/ThemeProvider";
import { useEffect, useState } from "react";
import { useUser } from "@/providers/UserProvider";
import { PAGES_META, APP_NAME } from "shared/data";
import clsx from "clsx";

export const Main = ({ type = "error" }: { type: "error" | "not-found" }) => {
  const { theme, lang } = useTheme();
  const { user } = useUser();
  const [ready, setReady] = useState(false);
  const isError = type === "error";
  const meta = PAGES_META[type]?.[lang];

  useEffect(() => {
    if (!meta) return;
    document.title = meta.title + " | " + APP_NAME;
  }, [meta, lang]);

  return (
    <section
      className={clsx(
        "relative flex h-screen w-full items-center justify-center overflow-hidden",
        theme === "dark" ? "bg-background" : "bg-primary",
      )}
    >
      <Beams
        beamWidth={3}
        beamHeight={30}
        beamNumber={20}
        lightColor={theme === "dark" ? "#ffffff" : "#432dd7"}
        speed={2}
        noiseIntensity={1.75}
        scale={0.2}
        rotation={30}
        beamColor={theme === "dark" ? "#000000" : "#432dd7"}
        backgroundColor={theme === "dark" ? "#000000" : "#ffffff"}
        onCreated={() => setReady(true)}
        isReady={ready}
      />
      <div className="absolute top-1/2 left-1/2 z-10 flex w-full max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col items-center px-6 text-center text-white">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
          {meta.title}
        </h1>
        <p className="mt-5 max-w-md text-sm leading-6 text-white/75 sm:text-base">
          {meta.description}
        </p>
        {!isError && (
          <>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {user ? (
                <Button asChild>
                  <Link href="/profile">{PAGES_META.profile[lang].title}</Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/login">{PAGES_META.login[lang].title}</Link>
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
};
