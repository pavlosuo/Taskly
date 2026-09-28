"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QrCode, ArrowUpRight } from "lucide-react";
import { useUser } from "@/providers/UserProvider";
import { QRCode } from "@/shared/components/QRCode";
import { SectionCard } from "@/screens/user/ui";

export function QRCard() {
  const { user } = useUser();
  if (!user) return null;
  const link = user.publicLink || "";
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 items-start">
      <SectionCard
        icon={<QrCode className="w-6 h-6 text-background" />}
        title="QR Code"
        desc="Your QR Code. Share it with your clients."
      />
      <div className="border border-border bg-background p-4 flex justify-between items-end">
        <Button variant="link" asChild>
          <Link href={link} target="_blank" className="flex items-center gap-1">
            <span>View my profile</span>
            <ArrowUpRight className="w-6 h-6" />
          </Link>
        </Button>
        <QRCode url={link} name={`@${user.username}`} />
      </div>
    </div>
  );
}
