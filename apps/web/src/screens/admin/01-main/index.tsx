"use client";
import { useUser } from "@/providers/UserProvider";
import { ClickwrapAdmin } from "@/shared/components/Clickwrap";

export function Main() {
  return (
    <section>
      <ClickwrapAdmin />
    </section>
  );
}
