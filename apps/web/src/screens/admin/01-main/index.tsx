"use client";
import { PrivacyPolicyAdmin } from "@/shared/components/PrivacyPolicy";
import { SectionCard } from "@/screens/user/ui";
import { GlobeLock } from "lucide-react";

export function Main() {
  return (
    <section className="w-full px-4">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 items-start">
          <SectionCard
            icon={<GlobeLock className="w-6 h-6 text-background" />}
            title="Privacy Policy"
            desc="Edit privacy policy."
          />
          <PrivacyPolicyAdmin />
        </div>
      </div>
    </section>
  );
}
