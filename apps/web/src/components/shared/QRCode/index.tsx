"use client";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/providers/ThemeProvider";

const EXPORT_SIZE = 400;

export function QRCode({ url, name }: { url: string; name: string }) {
  const { t } = useTranslation("common");
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();

  const exportRef = useRef<HTMLDivElement>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  if (!url) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      return;
    }
    setCopied(true);
    clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPng = () => {
    const svg = exportRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = EXPORT_SIZE;
      canvas.height = EXPORT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(svgUrl);
        return;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);
      ctx.drawImage(img, 0, 0, EXPORT_SIZE, EXPORT_SIZE);
      URL.revokeObjectURL(svgUrl);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `${new Date().toISOString().replace(/[:.]/g, "-")}-qrcode.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      }, "image/png");
    };
    img.onerror = () => URL.revokeObjectURL(svgUrl);
    img.src = svgUrl;
  };

  return (
    <div className="flex flex-col items-center gap-4 bg-background p-6 w-fit border border-border">
      <div className="border border-border p-3">
        <QRCodeSVG
          value={url}
          size={200}
          bgColor={theme === "light" ? "#fff" : "#0c0c09"}
          fgColor={theme === "light" ? "#0c0c09" : "#fff"}
          level="H"
          includeMargin={true}
        />
      </div>
      <div ref={exportRef} aria-hidden="true" className="hidden">
        <QRCodeSVG
          value={url}
          size={EXPORT_SIZE}
          bgColor="#ffffff"
          fgColor="#0c0c09"
          level="H"
          includeMargin={true}
        />
      </div>
      <p className="max-w-55 truncate text-sm text-grey" title={name}>
        {name}
      </p>
      <div className="flex gap-2">
        <Button onClick={handleCopy} variant="secondary" className="w-[12ch]">
          {copied ? t("qrCode.copied") : t("qrCode.copyLink")}
        </Button>
        <Button onClick={handleDownloadPng} variant="default">
          {t("qrCode.download")}
        </Button>
      </div>
    </div>
  );
}
