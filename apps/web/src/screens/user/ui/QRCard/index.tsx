"use client";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { QrCode, ArrowUpRight } from "lucide-react";
import { useUser } from "@/providers/UserProvider";
import { QRCode } from "@/components/shared/QRCode";
import { SectionCard } from "@/screens/user/ui";

export function QRCard() {
  const { t } = useTranslation("profile");
  const { user } = useUser();
  if (!user) return null;
  const link = user.publicLink || "";
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 items-start">
      <SectionCard
        icon={<QrCode aria-hidden="true" className="w-6 h-6 text-background" />}
        title={t("qr.title")}
        desc={t("qr.desc")}
      />
      <div className="border border-border bg-background p-4 flex justify-between items-end">
        <Button variant="link" asChild>
          <Link
            href={link}
            target="_blank"
            aria-label={t("qr.viewProfileAria")}
            className="flex items-center gap-1"
          >
            <span>{t("qr.viewProfile")}</span>
            <ArrowUpRight aria-hidden="true" className="w-6 h-6" />
          </Link>
        </Button>
        <QRCode url={link} name={`@${user.username}`} />
      </div>
    </div>
  );
}
