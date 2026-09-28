"use client";
import { Plus, Trash2 } from "lucide-react";
import { useUser } from "@/providers/UserProvider";
import { useMediaPicker } from "@/providers/MediaPickerProvider";
import { ImageDisplay } from "@/shared/components/MediaPicker";
import { SectionCard } from "@/screens/user/ui";

export function AvatarCard() {
  const { user, updateProfile } = useUser();
  const { openPicker } = useMediaPicker();
  if (!user) return null;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 items-start">
      <SectionCard
        icon={<Plus className="w-6 h-6 text-background" />}
        title="Profile photo"
        desc="Your avatar shown to clients and on your public profile."
      />
      <div className="border border-border bg-background p-4">
        <div className="flex items-center gap-4">
          {user.profile?.avatar ? (
            <div className="w-16 h-16 rounded-full object-cover relative">
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
                className="absolute right-0 bottom-0 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all duration-150 hover:bg-destructive group-hover:opacity-100"
                aria-label="Remove introduction video"
              >
                <Trash2 className="h-3.5 w-3.5" />
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
                  onSelect: (item) => {
                    updateProfile({
                      avatar: item[0],
                    });
                  },
                })
              }
              className="text-sm font-medium text-primary hover:underline underline-offset-2 cursor-pointer"
            >
              Change photo
            </button>
            <p className="text-xs text-grey mt-0.5">JPG, PNG — max 10MB</p>
          </div>
        </div>
      </div>
    </div>
  );
}
