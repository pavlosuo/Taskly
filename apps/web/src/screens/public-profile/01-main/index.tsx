"use client";
import { ImageDisplay } from "@/shared/components/MediaPicker";
import parse from "html-react-parser";
import {
  BadgeCheck,
  CalendarDays,
  Languages as LanguagesIcon,
  MessageCircle,
  ShieldCheck,
  TvMinimalPlay,
  Drill,
} from "lucide-react";
import { PublicProfileUser } from "@shared/types";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/shared/components/Player";
import { SpanField } from "@/screens/user/ui/index.tsx";
import { useLightbox } from "@/providers/LightboxProvider";
import { MediaItemPublic, AccessReason } from "@shared/types";
import { CERF } from "@shared/data";
import { OnlineStatus } from "@/shared/components/OnlineStatus";
import { useTheme } from "@/providers/ThemeProvider";
import { PublicHeader } from "@/shared/components/PublicHeader";

type Props = {
  user: PublicProfileUser;
  accessReason: AccessReason;
};

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

export const Main = ({ user, accessReason }: Props) => {
  const p = user.publicProfile;
  const { setLightbox } = useLightbox();
  const { lang } = useTheme();
  if (!p) return null;
  const hasSkills = !!p?.skills?.length;
  const hasCertificates = !!p?.certificates?.length;
  const hasLanguages = !!p?.languages?.length;
  const hasVideo = !!p?.introduction;
  const hasHeader = !!p?.header;
  const firstName = user.profile.fullName.split(" ")[0];
  const certificateItems: MediaItemPublic[] = (p.certificates ?? [])
    .filter((c) => !!c.media)
    .map((c) => ({
      url: c.media!.url,
      originalName: c.label,
      mimeType: c.media!.mimeType,
    }));

  return (
    <>
      <PublicHeader accessReason={accessReason} />
      {hasHeader && (
        <ImageDisplay
          src={p.header!.url}
          alt="Header image"
          className="h-40 sm:h-52 w-full object-cover relative z-10"
        />
      )}
      <section className="w-full max-w-5xl mx-auto px-4 py-10 lg:py-14">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-8 border-b border-border">
          <div className="relative shrink-0">
            {user.profile.avatar ? (
              <ImageDisplay
                src={user.profile.avatar.url}
                alt={user.profile.fullName}
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
                {user.profile.fullName}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground capitalize">
                {user.role}
              </span>
              {hasCertificates && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-sm text-grey mt-0.5">@{user.username}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-grey">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                Member since{" "}
                {new Date(user.createdAt).toLocaleDateString(lang, {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              {hasLanguages && (
                <span className="inline-flex items-center gap-1.5">
                  <LanguagesIcon className="w-3.5 h-3.5" />
                  Speaks {p.languages!.map((l) => l.label).join(", ")}
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0 sm:self-center grid grid-cols-1 gap-2.5 justify-items-center">
            <OnlineStatus user={user} />
            <Button>
              <MessageCircle className="w-4 h-4" />
              Hire {firstName}
            </Button>
          </div>
        </div>
        {(hasSkills || hasCertificates || hasLanguages) && (
          <div className="flex flex-wrap gap-2 py-5 border-b border-border">
            <ScrollChip
              id="skills"
              label="skills"
              count={p.skills?.length ?? 0}
            />
            <ScrollChip
              id="certificates"
              label="certificates"
              count={p.certificates?.length ?? 0}
            />
            <ScrollChip
              id="languages"
              label="languages"
              count={p.languages?.length ?? 0}
            />
          </div>
        )}
        <div id="about" className="py-8 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground mb-3">About</h2>
          {p?.bio ? (
            <div className="text-wrapper text-sm text-foreground leading-relaxed">
              {parse(p.bio)}
            </div>
          ) : (
            <EmptyState
              label={`${user.profile.fullName} hasn't written a bio yet.`}
            />
          )}
        </div>
        <div id="introduction" className="py-8 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <TvMinimalPlay className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Introduction video
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
            <EmptyState
              label={`${user.profile.fullName} hasn't added an introduction video yet.`}
            />
          )}
        </div>
        <div id="skills" className="py-8 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <Drill className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Skills</h2>
          </div>
          {hasSkills ? (
            <div className="flex flex-wrap gap-2">
              {p.skills!.map((s) => (
                <SpanField key={s.value} text={s.label} />
              ))}
            </div>
          ) : (
            <EmptyState label="No skills added yet." />
          )}
        </div>
        <div id="certificates" className="py-8 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Certificates
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
                        alt={c.label}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 via-black/10 to-transparent p-2.5">
                        <p className="flex items-center gap-1 text-xs font-medium text-white">
                          <BadgeCheck className="w-3.5 h-3.5 shrink-0" />
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
                    <BadgeCheck className="w-5 h-5 text-primary" />
                    <span className="text-xs font-medium text-foreground truncate w-full">
                      {c.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState label="No certificates added yet." />
          )}
        </div>
        <div id="languages" className="py-8">
          <div className="flex items-center gap-2 mb-3">
            <LanguagesIcon className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Languages</h2>
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
                        aria-label={`View ${l.label} certificate`}
                      >
                        <ImageDisplay
                          src={certUrl}
                          alt={l.label}
                          className="w-10 h-10 object-cover hover:opacity-80 transition-opacity"
                        />
                      </button>
                    ) : (
                      <div className="w-10 h-10 border border-primary bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <LanguagesIcon className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0 w-28 shrink-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {l.label}
                      </p>
                      <p className="text-xs text-grey">{l.level}</p>
                    </div>
                    <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
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
            <EmptyState label="No languages added yet." />
          )}
        </div>
      </section>
    </>
  );
};
