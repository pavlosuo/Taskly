"use client";
import { AvatarCard, PublicProfileCard, QRCard } from "@/screens/user/ui";

export function Profile() {
  return (
    <section className="w-full px-4">
      <div className="flex flex-col gap-4">
        <AvatarCard />
        <PublicProfileCard />
        <QRCard />
      </div>
    </section>
  );
}
