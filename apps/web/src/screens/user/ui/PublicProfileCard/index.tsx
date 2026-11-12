"use client";
import { useState } from "react";
import clsx from "clsx";
import { useTranslation } from "@/hooks/useTranslation";
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
import { ImageDisplay } from "@/components/shared/MediaPicker";
import { Tiptap } from "@/components/shared/Tiptap";
import { VideoPlayer } from "@/components/shared/VideoPlayer";
import {
  PublicProfile,
  ZodErrors,
  removeHtml,
  publicProfileSchema,
  MESSAGE_MAX_LENGTH,
} from "shared/index";
import {
  SectionCard,
  SpanField,
  FormField,
  LanguagesEditor,
  CertificatesEditor,
  SkillsEditor,
} from "@/screens/user/ui";
import { useToast } from "@/hooks/useToast";

export function PublicProfileCard() {
  const { t } = useTranslation(["profile", "common"]);
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
  const toast = useToast();

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
    setErrors((p) => ({ ...p, [field]: undefined }));
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
        });
        toast(formErrors[0]);
        return;
      }
      await updateProfile({
        publicProfile: { ...user?.publicProfile, ...parsed.data },
      });
      setOpen(false);
    } catch {}
  };

  if (!user) return null;

  const p = user.publicProfile;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 items-start">
      <SectionCard
        icon={<Star aria-hidden="true" className="w-6 h-6 text-background" />}
        title={t("publicProfile.title")}
        desc={t("publicProfile.desc", { appName: t("common:appName") })}
      />
      <div className="border border-border bg-background p-4">
        <div className="flex justify-end mb-4 -mt-1">
          <button
            onClick={openDialog}
            aria-label={t("publicProfile.editAria")}
            className="text-sm font-medium text-primary hover:underline underline-offset-2 flex items-center gap-1"
          >
            <SquarePen aria-hidden="true" className="w-4 h-4" />
            <span>{t("actions.edit")}</span>
          </button>
        </div>
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs text-grey mb-1">
              {t("publicProfile.aboutMe")}
            </p>
            <div className="text-wrapper">
              {p?.bio ? parseSafeHtml(p?.bio) : "—"}
            </div>
          </div>
          <div className="h-px bg-border" />
          {user.role === "tasker" && (
            <>
              <div>
                <p className="text-xs text-grey mb-2">
                  {t("publicProfile.skills")}
                </p>
                {p?.skills?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {p.skills.map((s) => (
                      <SpanField text={s.label} key={s.value} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-grey">
                    {t("publicProfile.noSkills")}
                  </p>
                )}
              </div>
              <div className="h-px bg-border" />
              <div>
                <p className="text-xs text-grey mb-2">
                  {t("publicProfile.certificates")}
                </p>
                {p?.certificates?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {p.certificates.map((c) => {
                      return (
                        <SpanField
                          icon={
                            <BadgeCheck
                              aria-hidden="true"
                              className="w-3.5 h-3.5"
                            />
                          }
                          text={c.label}
                          key={c.value}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-grey">
                    {t("publicProfile.noCertificates")}
                  </p>
                )}
              </div>
              <div className="h-px bg-border" />
            </>
          )}
          <div>
            <p className="text-xs text-grey mb-2">
              {t("publicProfile.languages")}
            </p>
            {p?.languages?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {p.languages.map((l) => (
                  <SpanField key={l.value} text={t(`common:${l.label}`)} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-grey">
                {t("publicProfile.noLanguages")}
              </p>
            )}
          </div>
          <div className="h-px bg-border" />
          <div>
            <p className="text-xs text-grey mb-2">
              {t("publicProfile.headerTitle")}
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
                    aria-label={t("publicProfile.removeHeader")}
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
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
                    <Upload aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium">
                    {t("publicProfile.addHeader")}
                  </span>
                </button>
              )}
            </div>
          </div>
          {user.role === "tasker" && (
            <>
              <div className="h-px bg-border" />
              <div>
                <p className="text-xs text-grey mb-2">
                  {t("publicProfile.introTitle")}
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
                        poster={
                          user.publicProfile!.introduction?.posterFilename
                            ? user.publicProfile!.introduction?.url.replace(
                                /\/file$/,
                                "/poster",
                              )
                            : undefined
                        }
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
                        aria-label={t("publicProfile.removeIntro")}
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
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
                        <Upload aria-hidden="true" className="h-5 w-5" />
                      </span>
                      <span className="text-sm font-medium">
                        {t("publicProfile.addIntro")}
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
            <DialogTitle>{t("publicProfile.dialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("publicProfile.dialogDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-2">
            <FormField
              label={t("publicProfile.aboutMe")}
              htmlFor="bio"
              error={errors.bio}
            >
              <Tiptap
                value={form.bio ?? ""}
                onUpdate={({ editor }) => handleChange("bio", editor.getHTML())}
                error={errors.bio}
              />
              <p
                className={clsx(
                  "text-xs text-right mt-1",
                  removeHtml(form.bio ?? "").length > MESSAGE_MAX_LENGTH
                    ? "text-destructive"
                    : "text-grey",
                )}
              >
                {removeHtml(form.bio ?? "").length}/{MESSAGE_MAX_LENGTH}
              </p>
            </FormField>
            <div className="h-px bg-border" />
            {user.role === "tasker" && (
              <>
                <FormField
                  label={t("publicProfile.skills")}
                  error={errors.skills}
                >
                  <p className="text-xs text-grey mb-2">
                    {t("publicProfile.skillsHint")}
                  </p>
                  <SkillsEditor
                    value={form.skills ?? []}
                    onChange={(skills) => handleChange("skills", skills)}
                    error={errors.skills}
                  />
                </FormField>
                <div className="h-px bg-border" />
                <FormField
                  label={t("publicProfile.certificates")}
                  error={errors.certificates}
                >
                  <p className="text-xs text-grey mb-2">
                    {t("publicProfile.certificatesHint")}
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
            <FormField
              label={t("publicProfile.languages")}
              error={errors.languages}
            >
              <p className="text-xs text-grey mb-2">
                {t("publicProfile.languagesHint")}
              </p>
              <LanguagesEditor
                value={form.languages ?? []}
                onChange={(langs) => handleChange("languages", langs)}
                error={errors.languages}
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("actions.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? t("actions.saving") : t("actions.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
