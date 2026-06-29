"use client";

import { useEffect, useState } from "react";
import { BASE_URL } from "@/api";

export function PDFView() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/agreement/pdf`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load PDF");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch {}
    };
    loadPdf();
  }, []);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  if (!pdfUrl)
    return (
      <div className="w-200 h-200 bg-foreground rounded-2xl overflow-hidden mx-auto">
        <span className="text-center text-2xl text-white p-10 block">
          Loading...
        </span>
      </div>
    );

  return (
    <div className="w-200 h-200 bg-foreground rounded-2xl overflow-hidden mx-auto">
      <iframe src={pdfUrl} className="w-full h-full" />
    </div>
  );
}
