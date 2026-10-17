"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ImageDisplay } from "@/components/shared/MediaPicker";
import parseSafeHtml from "@/utils/parseSafeHtml";
import {
  BadgeCheck,
  CalendarDays,
  Languages as LanguagesIcon,
  MessageCircle,
  ShieldCheck,
  TvMinimalPlay,
  Drill,
} from "lucide-react";
import {
  PublicProfileUser,
  MediaItemPublic,
  AccessReason,
  CERF,
} from "shared/index";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/shared/VideoPlayer";
import { SpanField } from "@/screens/user/ui/index.tsx";
import { useLightbox } from "@/providers/LightboxProvider";
import { OnlineStatus } from "@/components/shared/OnlineStatus";
import { PublicHeader } from "@/components/shared/PublicHeader";
import { useRouter } from "next/navigation";
import { useChats } from "@/providers/ChatProvider";
import { useUser } from "@/providers/UserProvider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFormatDate } from "@/hooks/useFormatDate";
import { useToast } from "@/hooks/useToast";
import { getAxiosError } from "@/utils/getAxiosError";

function ScrollChip({
  id,
  label,
  count,
}: {
  id: string;
  label: string;
  count?: number;
}) {
  if (!count) return null;
  return (
    <a
      href={`#${id}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-primary/5"
    >
      <span className="text-primary font-semibold">{count}</span>
      {label}
    </a>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p className="text-sm text-grey">{label}</p>;
}

export const Main = ({
  user,
  accessReason,
}: {
  user: PublicProfileUser;
  accessReason?: AccessReason;
}) => {
  const { t } = useTranslation(["user", "errors"]);
  const p = user.publicProfile;
  const toast = useToast();
  const { setLightbox } = useLightbox();
  const router = useRouter();
  const { createChat } = useChats();
  const { user: me } = useUser();
  const [isStarting, setIsStarting] = useState(false);
  const time = useFormatDate(user.createdAt, {
    month: "long",
    year: "numeric",
  });
  if (!p) return null;
  const hasSkills = !!p?.skills?.length;
  const hasCertificates = !!p?.certificates?.length;
  const hasLanguages = !!p?.languages?.length;
  const hasVideo = !!p?.introduction;
  const hasHeader = !!p?.header;
  const isTasker = user.role === "tasker";
  const showChips =
    hasLanguages || (isTasker && (hasSkills || hasCertificates));
  const name = user.profile.fullName;
  const firstName = name.split(" ")[0];
  const certificateItems: MediaItemPublic[] = (p.certificates ?? [])
    .filter((c) => !!c.media)
    .map((c) => ({
      url: c.media!.url,
      originalName: c.label,
      mimeType: c.media!.mimeType,
    }));
  const languagesList = hasLanguages
    ? p.languages!.map((l) => l.label).join(", ")
    : "";
  const isOwnProfile = me && me._id === user._id;
  const isLoggedOut = !me;
  const isDisabled = isLoggedOut || isOwnProfile;
  const disabledReason = isLoggedOut
    ? t("hireDisabled.loggedOut")
    : isOwnProfile
      ? t("hireDisabled.own")
      : null;

  const handleSelect = async (userId: string) => {
    if (isStarting) return;
    try {
      setIsStarting(true);
      const chat = await createChat(userId);
      router.push(`/chats/${chat._id}`);
    } catch (e) {
      toast(getAxiosError(e));
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <>
      <PublicHeader accessReason={accessReason} />
      {hasHeader && (
        <ImageDisplay
          src={p.header!.url}
          alt={t("headerAlt")}
          className="h-40 sm:h-52 w-full object-cover relative z-10"
        />
      )}
      <section className="w-full max-w-5xl mx-auto px-4 py-10 lg:py-14">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-8 border-b border-border">
          <div className="relative shrink-0">
            {user.profile.avatar ? (
              <ImageDisplay
                src={user.profile.avatar.url}
                alt={name}
                width={88}
                height={88}
                className="w-22 h-22 rounded-full object-cover ring-4 ring-primary/10"
              />
            ) : (
              <div className="w-22 h-22 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold ring-4 ring-primary/10">
                {user.profile.initials}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground truncate">
                {name}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                {t(`roles.${user.role}`, { defaultValue: user.role })}
              </span>
              {user.acceptance.personVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  <ShieldCheck aria-hidden="true" className="w-3 h-3" />
                  {t("verified")}
                </span>
              )}
            </div>
            <p className="text-sm text-grey mt-0.5">@{user.username}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-grey">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays aria-hidden="true" className="w-3.5 h-3.5" />
                {t("memberSince", { date: time })}
              </span>
              {hasLanguages && (
                <span className="inline-flex items-center gap-1.5">
                  <LanguagesIcon aria-hidden="true" className="w-3.5 h-3.5" />
                  {t("speaks", { languages: languagesList })}
                </span>
              )}
            </div>
          </div>
          {isDisabled ? (
            <div className="shrink-0 sm:self-center grid grid-cols-1 gap-2.5 justify-items-center opacity-50">
              <OnlineStatus user={user} />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex" tabIndex={0}>
                    <Button disabled className="pointer-events-none">
                      <MessageCircle aria-hidden="true" className="w-4 h-4" />
                      {t("hire", { name: firstName })}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{disabledReason}</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="shrink-0 sm:self-center grid grid-cols-1 gap-2.5 justify-items-center">
              <OnlineStatus user={user} />
              <Button
                disabled={isStarting}
                onClick={() => handleSelect(user._id)}
              >
                <MessageCircle aria-hidden="true" className="w-4 h-4" />
                {t("hire", { name: firstName })}
              </Button>
            </div>
          )}
        </div>
        {showChips && (
          <div className="flex flex-wrap gap-2 py-5 border-b border-border">
            {isTasker && (
              <>
                <ScrollChip
                  id="skills"
                  label={t("chips.skills", { count: p.skills?.length ?? 0 })}
                  count={p.skills?.length ?? 0}
                />
                <ScrollChip
                  id="certificates"
                  label={t("chips.certificates", {
                    count: p.certificates?.length ?? 0,
                  })}
                  count={p.certificates?.length ?? 0}
                />
              </>
            )}
            <ScrollChip
              id="languages"
              label={t("chips.languages", { count: p.languages?.length ?? 0 })}
              count={p.languages?.length ?? 0}
            />
          </div>
        )}
        <div id="about" className="py-8 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            {t("sections.about")}
          </h2>
          {p?.bio ? (
            <div className="text-wrapper text-sm text-foreground leading-relaxed">
              {parseSafeHtml(p.bio)}
            </div>
          ) : (
            <EmptyState label={t("empty.bio", { name })} />
          )}
        </div>
        {isTasker && (
          <>
            <div id="introduction" className="py-8 border-b border-border">
              <div className="flex items-center gap-2 mb-3">
                <TvMinimalPlay
                  aria-hidden="true"
                  className="w-4 h-4 text-primary"
                />
                <h2 className="text-sm font-semibold text-foreground">
                  {t("sections.introduction")}
                </h2>
              </div>
              {hasVideo ? (
                <div className="group relative aspect-video w-full">
                  <VideoPlayer
                    src={p.introduction!.url}
                    className="h-full w-full"
                  />
                </div>
              ) : (
                <EmptyState label={t("empty.introduction", { name })} />
              )}
            </div>
            <div id="skills" className="py-8 border-b border-border">
              <div className="flex items-center gap-2 mb-3">
                <Drill aria-hidden="true" className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">
                  {t("sections.skills")}
                </h2>
              </div>
              {hasSkills ? (
                <div className="flex flex-wrap gap-2">
                  {p.skills!.map((s) => (
                    <SpanField key={s.value} text={s.label} />
                  ))}
                </div>
              ) : (
                <EmptyState label={t("empty.skills")} />
              )}
            </div>
            <div id="certificates" className="py-8 border-b border-border">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck
                  aria-hidden="true"
                  className="w-4 h-4 text-primary"
                />
                <h2 className="text-sm font-semibold text-foreground">
                  {t("sections.certificates")}
                </h2>
              </div>
              {hasCertificates ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {p.certificates!.map((c) => {
                    const hasImage = !!c.media;
                    const galleryIndex = hasImage
                      ? certificateItems.findIndex(
                          (item) => item.url === c.media!.url,
                        )
                      : -1;
                    if (hasImage && galleryIndex >= 0) {
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() =>
                            setLightbox({
                              items: certificateItems,
                              index: galleryIndex,
                            })
                          }
                          className="group relative aspect-4/3 overflow-hidden rounded-lg border border-border bg-muted"
                        >
                          <ImageDisplay
                            src={c.media!.url}
                            alt=""
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 via-black/10 to-transparent p-2.5">
                            <p className="flex items-center gap-1 text-xs font-medium text-white">
                              <BadgeCheck
                                aria-hidden="true"
                                className="w-3.5 h-3.5 shrink-0"
                              />
                              <span className="truncate">{c.label}</span>
                            </p>
                          </div>
                        </button>
                      );
                    }
                    return (
                      <div
                        key={c.value}
                        className="flex aspect-4/3 flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-muted px-2 text-center"
                      >
                        <BadgeCheck
                          aria-hidden="true"
                          className="w-5 h-5 text-primary"
                        />
                        <span className="text-xs font-medium text-foreground truncate w-full">
                          {c.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState label={t("empty.certificates")} />
              )}
            </div>
          </>
        )}
        <div id="languages" className="py-8">
          <div className="flex items-center gap-2 mb-3">
            <LanguagesIcon
              aria-hidden="true"
              className="w-4 h-4 text-primary"
            />
            <h2 className="text-sm font-semibold text-foreground">
              {t("sections.languages")}
            </h2>
          </div>
          {hasLanguages ? (
            <div className="flex flex-col gap-2">
              {p.languages!.map((l) => {
                const levelIdx = CERF.indexOf(l.level);
                const pct = ((levelIdx + 1) / CERF.length) * 100;
                const certUrl = l.certificate?.media?.url;
                return (
                  <div
                    key={l.value}
                    className="flex items-center gap-3 border border-border px-4 py-3"
                  >
                    {certUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          setLightbox({
                            items: [
                              {
                                url: certUrl,
                                originalName: l.label,
                                mimeType: l.certificate?.media?.mimeType || "",
                              },
                            ],
                            index: 0,
                          })
                        }
                        className="shrink-0 border border-primary"
                        aria-label={t("certificate.view", { name: l.label })}
                      >
                        <ImageDisplay
                          src={certUrl}
                          alt=""
                          className="w-10 h-10 object-cover hover:opacity-80 transition-opacity"
                        />
                      </button>
                    ) : (
                      <div className="w-10 h-10 border border-primary bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <LanguagesIcon aria-hidden="true" className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0 w-28 shrink-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {l.label}
                      </p>
                      <p className="text-xs text-grey">{l.level}</p>
                    </div>
                    <div
                      aria-hidden="true"
                      className="flex-1 h-1.5 rounded-full bg-border overflow-hidden"
                    >
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState label={t("empty.languages")} />
          )}
        </div>
      </section>
    </>
  );
};
