"use client";
import { useState } from "react";
import clsx from "clsx";
import parseSafeHtml from "@/utils/parseSafeHtml";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Star, BadgeCheck, Upload, Trash2, SquarePen } from "lucide-react";
import { useMediaPicker } from "@/providers/MediaPickerProvider";
import { useUser } from "@/providers/UserProvider";
import { getAxiosError } from "@/utils/getAxiosError";
import { ImageDisplay } from "@/components/shared/MediaPicker";
import { Tiptap } from "@/components/shared/Tiptap";
import { VideoPlayer } from "@/components/shared/VideoPlayer";
import {
  PublicProfile,
  ZodErrors,
  removeHtml,
  publicProfileSchema,
} from "shared/index";
import {
  SectionCard,
  SpanField,
  FormField,
  LanguagesEditor,
  CertificatesEditor,
  SkillsEditor,
} from "@/screens/user/ui";
import { FieldError } from "@/components/shared/FieldError";

export function PublicProfileCard() {
  const { isOpen } = useMediaPicker();
  const { user, updateProfile, isLoading } = useUser();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<ZodErrors<PublicProfile>>({});
  const [form, setForm] = useState<PublicProfile>({
    bio: user?.publicProfile?.bio ?? "",
    skills: user?.publicProfile?.skills,
    certificates: user?.publicProfile?.certificates,
    languages: user?.publicProfile?.languages,
  });
  const { openPicker } = useMediaPicker();
  const hasHeader = Boolean(user?.publicProfile?.header);
  const hasIntroduction = Boolean(user?.publicProfile?.introduction);

  const openDialog = () => {
    setForm({
      bio: user?.publicProfile?.bio ?? "",
      skills: user?.publicProfile?.skills ?? [],
      certificates: user?.publicProfile?.certificates ?? [],
      languages: user?.publicProfile?.languages ?? [],
    });
    setErrors({});
    setOpen(true);
  };

  const handleChange = <K extends keyof PublicProfile>(
    field: K,
    value: PublicProfile[K],
  ) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined, general: undefined }));
  };

  const handleSave = async () => {
    setErrors({});
    try {
      const parsed = publicProfileSchema.safeParse(form);
      if (!parsed.success) {
        const { fieldErrors, formErrors } = parsed.error.flatten();
        setErrors({
          bio: fieldErrors.bio?.[0],
          skills: fieldErrors.skills?.[0],
          certificates: fieldErrors.certificates?.[0],
          languages: fieldErrors.languages?.[0],
          general: formErrors[0],
        });
        return;
      }
      await updateProfile({
        publicProfile: { ...user?.publicProfile, ...parsed.data },
      });
      setOpen(false);
    } catch (e) {
      setErrors({ general: getAxiosError(e) });
    }
  };

  if (!user) return null;

  const p = user.publicProfile;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 items-start">
      <SectionCard
        icon={<Star className="w-6 h-6 text-background" />}
        title="Public profile"
        desc="What clients see when they find you on Taskly."
      />
      <div className="border border-border bg-background p-4">
        <div className="flex justify-end mb-4 -mt-1">
          <button
            onClick={openDialog}
            className="text-sm font-medium text-primary hover:underline underline-offset-2 flex items-center gap-1"
          >
            <SquarePen className="w-4 h-4" />
            <span>Edit</span>
          </button>
        </div>
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs text-grey mb-1">About me</p>
            <div className="text-wrapper">
              {p?.bio ? parseSafeHtml(p?.bio) : "—"}
            </div>
          </div>
          <div className="h-px bg-border" />
          {user.role === "tasker" && (
            <>
              <div>
                <p className="text-xs text-grey mb-2">Skills</p>
                {p?.skills?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {p.skills.map((s) => (
                      <SpanField text={s.label} key={s.value} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-grey">No skills added yet.</p>
                )}
              </div>
              <div className="h-px bg-border" />
              <div>
                <p className="text-xs text-grey mb-2">Certificates</p>
                {p?.certificates?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {p.certificates.map((c) => {
                      return (
                        <SpanField
                          icon={<BadgeCheck className="w-3.5 h-3.5" />}
                          text={c.label}
                          key={c.value}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-grey">
                    No certificates added yet.
                  </p>
                )}
              </div>
              <div className="h-px bg-border" />
            </>
          )}
          <div>
            <p className="text-xs text-grey mb-2">Languages</p>
            {p?.languages?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {p.languages.map((l) => (
                  <SpanField key={l.value} text={l.label} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-grey">No languages added yet.</p>
            )}
          </div>
          <div className="h-px bg-border" />
          <div>
            <p className="text-xs text-grey mb-2">
              Add a header for your profile
            </p>
            <div
              className={clsx(
                "group relative h-45 overflow-hidden border transition-colors",
                hasHeader
                  ? "border-border bg-background"
                  : "border-dashed border-border",
              )}
            >
              {hasHeader ? (
                <>
                  <ImageDisplay
                    src={user.publicProfile!.header!.url}
                    alt={user.profile.fullName}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-black/50 to-transparent" />
                  <button
                    type="button"
                    onClick={() =>
                      updateProfile({
                        publicProfile: {
                          ...user.publicProfile,
                          header: null,
                        },
                      })
                    }
                    className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-all duration-150 hover:bg-destructive group-hover:opacity-100"
                    aria-label="Remove header image"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    openPicker({
                      accept: "image",
                      onSelect: (item) => {
                        updateProfile({
                          publicProfile: {
                            ...user.publicProfile,
                            header: item[0],
                          },
                        });
                      },
                    })
                  }
                  className="flex h-full w-full flex-col items-center justify-center gap-2 text-foreground"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Upload className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium">Add header image</span>
                </button>
              )}
            </div>
          </div>
          {user.role === "tasker" && (
            <>
              <div className="h-px bg-border" />
              <div>
                <p className="text-xs text-grey mb-2">
                  Add a introduction video
                </p>
                <div
                  className={clsx(
                    "relative overflow-hidden border",
                    hasIntroduction
                      ? "border-border bg-background"
                      : "h-45 border-dashed border-border",
                  )}
                >
                  {hasIntroduction ? (
                    <div className="group relative aspect-video w-full">
                      <VideoPlayer
                        src={user.publicProfile!.introduction!.url}
                        className="h-full w-full"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateProfile({
                            publicProfile: {
                              ...user.publicProfile,
                              introduction: null,
                            },
                          })
                        }
                        className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-all duration-150 hover:bg-destructive group-hover:opacity-100"
                        aria-label="Remove introduction video"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        openPicker({
                          accept: "video",
                          onSelect: (item) => {
                            updateProfile({
                              publicProfile: {
                                ...user.publicProfile,
                                introduction: item[0],
                              },
                            });
                          },
                        })
                      }
                      className="flex h-full w-full flex-col items-center justify-center gap-2 text-foreground"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Upload className="h-5 w-5" />
                      </span>
                      <span className="text-sm font-medium">
                        Add introduction video
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (isOpen) return;
          setOpen(o);
        }}
      >
        <DialogContent className="sm:max-w-5xl w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit public profile</DialogTitle>
            <DialogDescription>
              This is what clients see when they browse taskers.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-2">
            <FormField label="About me" htmlFor="bio" error={errors.bio}>
              <Tiptap
                value={form.bio ?? ""}
                onUpdate={({ editor }) => handleChange("bio", editor.getHTML())}
                error={errors.bio}
              />
              <p
                className={clsx(
                  "text-xs text-right mt-1",
                  removeHtml(form.bio ?? "").length > 1000
                    ? "text-destructive"
                    : "text-grey",
                )}
              >
                {removeHtml(form.bio ?? "").length}/1000
              </p>
            </FormField>
            <div className="h-px bg-border" />
            {user.role === "tasker" && (
              <>
                <FormField label="Skills" error={errors.skills}>
                  <p className="text-xs text-grey mb-2">
                    Add skills you have — increases trust with clients.
                  </p>
                  <SkillsEditor
                    value={form.skills ?? []}
                    onChange={(skills) => handleChange("skills", skills)}
                    error={errors.skills}
                  />
                </FormField>
                <div className="h-px bg-border" />
                <FormField label="Certificates" error={errors.certificates}>
                  <p className="text-xs text-grey mb-2">
                    Add certificates you hold — increases trust with clients.
                  </p>
                  <CertificatesEditor
                    value={form.certificates ?? []}
                    onChange={(certificates) =>
                      handleChange("certificates", certificates)
                    }
                    error={errors.certificates}
                  />
                </FormField>
                <div className="h-px bg-border" />
              </>
            )}
            <FormField label="Languages" error={errors.languages}>
              <p className="text-xs text-grey mb-2">
                Add languages you speak — increases trust with clients.
              </p>
              <LanguagesEditor
                value={form.languages ?? []}
                onChange={(langs) => handleChange("languages", langs)}
                error={errors.languages}
              />
            </FormField>
          </div>
          <FieldError message={errors.general} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
