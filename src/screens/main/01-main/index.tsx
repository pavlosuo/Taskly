"use client";
import { useUser } from "providers/User";
import { ClickwrapAdmin } from "shared/components/Clickwrap";
import { PDFView } from "shared/components/PDFView";

export function Main() {
  const { user } = useUser();
  return (
    <section className="p-5">
      <p className="text-black">Hello {user?.username}</p>
      <PDFView />
      <ClickwrapAdmin />
    </section>
  );
}
