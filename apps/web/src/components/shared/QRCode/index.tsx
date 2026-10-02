"use client";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/providers/ThemeProvider";

export function QRCode({ url, name }: { url: string; name: string }) {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  if (!url) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPng = () => {
    const svg = document.getElementById("qr-svg");
    if (!svg) return;
    const SIZE = 400;
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      URL.revokeObjectURL(svgUrl);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${new Date().toISOString()}-qrcode.png`;
      link.click();
    };
    img.src = svgUrl;
  };

  return (
    <div className="flex flex-col items-center gap-4 bg-background p-6 w-fit border border-border">
      <div className="border border-border p-3">
        <QRCodeSVG
          id="qr-svg"
          value={url}
          size={200}
          bgColor={theme === "light" ? "#fff" : "#0c0c09"}
          fgColor={theme === "light" ? "#0c0c09" : "#fff"}
          level="H"
          includeMargin={true}
        />
      </div>
      <p className="max-w-55 truncate text-sm text-gray" title={name}>
        {name}
      </p>
      <div className="flex gap-2">
        <Button onClick={handleCopy} variant="secondary" className="w-[12ch]">
          {copied ? "Copied!" : "Copy link"}
        </Button>
        <Button onClick={handleDownloadPng} variant="default">
          Download Code
        </Button>
      </div>
    </div>
  );
}
