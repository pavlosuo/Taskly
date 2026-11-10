"use client";
import { Camera, Trash2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useUser } from "@/providers/UserProvider";
import { useMediaPicker } from "@/providers/MediaPickerProvider";
import { ImageDisplay } from "@/components/shared/MediaPicker";
import { SectionCard } from "@/screens/user/ui";

export function AvatarCard() {
  const { t } = useTranslation("profile");
  const { user, updateProfile } = useUser();
  const { openPicker } = useMediaPicker();
  if (!user) return null;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 items-start">
      <SectionCard
        icon={<Camera className="w-6 h-6 text-background" aria-hidden />}
        title={t("avatar.title")}
        desc={t("avatar.desc")}
      />
      <div className="border border-border bg-background p-4">
        <div className="flex items-center gap-4">
          {user.profile?.avatar ? (
            <div className="w-16 h-16 rounded-full relative">
              <ImageDisplay
                src={user.profile.avatar.url}
                alt={user.profile.fullName}
                className="rounded-full object-cover w-full h-full"
              />
              <button
                type="button"
                onClick={() =>
                  updateProfile({
                    avatar: null,
                  })
                }
                className="absolute right-0 bottom-0 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all duration-150 hover:bg-destructive"
                aria-label={t("avatar.remove")}
              >
                <Trash2 className="h-3 w-3" aria-hidden />
              </button>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-lg font-medium shrink-0">
              {user.profile?.initials}
            </div>
          )}
          <div>
            <button
              onClick={() =>
                openPicker({
                  accept: "image",
                  onSelect: (items) => {
                    updateProfile({
                      avatar: items[0],
                    });
                  },
                })
              }
              className="text-sm font-medium text-primary hover:underline underline-offset-2 cursor-pointer"
            >
              {t("avatar.change")}
            </button>
            <p className="text-xs text-grey mt-0.5">{t("avatar.hint")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
