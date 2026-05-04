"use client";
import { useUser } from "providers/User";
import { ClickwrapAdmin } from "shared/components/Clickwrap";
import { PDFView } from "shared/components/PDFView";

export function Main() {
  return (
    <section>
      <ClickwrapAdmin />
    </section>
  );
}
