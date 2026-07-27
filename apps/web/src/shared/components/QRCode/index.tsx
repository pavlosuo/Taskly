"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

export function QRCode({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
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
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-background p-6 shadow-md w-fit">
      <div className="rounded-xl border border-gray-100 p-3">
        <QRCodeSVG
          id="qr-svg"
          value={url}
          size={200}
          bgColor="#ffffff"
          fgColor="#000000"
          level="H"
          includeMargin={true}
        />
      </div>
      <p className="max-w-55 truncate text-sm text-gray" title={url}>
        {url}
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="bg-black px-0 py-2 text-sm font-medium w-[12ch] text-white transition hover:bg-gray-800 active:scale-95"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
        <button
          onClick={handleDownloadPng}
          className="border border-gray-300 px-4 py-2 text-sm font-medium text-grey transition hover:bg-gray-50 active:scale-95"
        >
          Download Code
        </button>
      </div>
    </div>
  );
}
