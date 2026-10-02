"use client";
import { Beams } from "@/components/shared/Beams";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/providers/ThemeProvider";
import { useEffect } from "react";
import { APP_NAME } from "shared/data";
import { useUser } from "@/providers/UserProvider";

export const Main = ({ type = "error" }: { type: "error" | "not-found" }) => {
  const { theme } = useTheme();
  const { user } = useUser();
  const isError = type === "error";

  useEffect(() => {
    document.title = isError
      ? `Error | ${APP_NAME}`
      : `Not found | ${APP_NAME}`;
  }, [isError]);

  return (
    <section className="relative flex h-screen w-full items-center justify-center overflow-hidden">
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
      />
      <div className="absolute top-1/2 left-1/2 z-10 flex w-full max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col items-center px-6 text-center text-white">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
          {isError ? "Something went wrong." : "This page got lost."}
        </h1>
        <p className="mt-5 max-w-md text-sm leading-6 text-white/75 sm:text-base">
          {isError
            ? "Some things went wrong. Please try again later."
            : "The page you’re looking for doesn’t exist or has been moved. Let’s get you back on track."}
        </p>
        {!isError && (
          <>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {user ? (
                <Button asChild>
                  <Link href="/profile">Profile</Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/login">Login</Link>
                </Button>
              )}
              <Button
                asChild
                variant="outline"
                className="border-white bg-transparent text-white hover:bg-white/25 hover:text-white"
              >
                <Link href="/services">View Services</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
