"use client";
import {
  AvatarCard,
  PublicProfileCard,
  HeaderCard,
  VideoCard,
} from "@/screens/user/ui";

export function Profile() {
  return (
    <section className="w-full px-4">
      <div className="flex flex-col gap-4">
        <AvatarCard />
        <HeaderCard />
        <VideoCard />
        <PublicProfileCard />
      </div>
    </section>
  );
}
