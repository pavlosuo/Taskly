"use client";
import { Screens } from "@/screens";
import { getMetaData } from "@/utils/Metadata";

export const metadata = getMetaData({
  title: "Error",
  description: "An error has occurred.",
});

export default function Error() {
  return (
    <>
      <Screens.Error.Main type="error" />
    </>
  );
}
