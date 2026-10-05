"use client";
import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";

export const metadata = getMetaData({
  title: "Error",
  description: "An error has occurred.",
});

export default function Error() {
  return (
    <main className="page">
      <Screens.Error.Main type="error" />
    </main>
  );
}
