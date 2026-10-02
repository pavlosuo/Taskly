"use client";
import dynamic from "next/dynamic";

export const LocationPicker = dynamic(
  () => import("./LocationPickerMap").then((mod) => mod.LocationPickerMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-56 w-full border border-border bg-muted" />
    ),
  },
);
