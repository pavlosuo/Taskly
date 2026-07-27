"use client";
import { useState } from "react";
import { SquarePen, Plus, Star, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tiptap } from "@/shared/components/Tiptap";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { SectionCard, FormField } from "@/screens/user/01-account/ui";
import { useUser } from "@/providers/User";
import { getAxiosError } from "@/utils/getAxiosError";
import clsx from "clsx";
import Image from "next/image";
import parse from "html-react-parser";
import { LanguagesEditor } from "@/screens/user/02-profile/ui/LanguagesEditor";
import {
  PublicProfileSkill,
  PublicProfileCertificate,
  PublicProfileLang,
} from "@shared/types";

const SKILL_SUGGESTIONS = [
  "Cleaning",
  "Dog walking",
  "Furniture assembly",
  "Minor repairs",
  "Gardening",
  "Moving help",
  "Delivery",
  "Elderly care",
  "Childcare",
  "Snow removal",
  "Window cleaning",
  "Painting",
  "IT help",
];

const CERTIFICATES = [
  {
    value: "hygieniapassi",
    label: "Hygieniapassi",
    desc: "Required for food/cleaning work",
  },
  {
    value: "tulityokortti",
    label: "Tulityökortti",
    desc: "Fire safety for construction",
  },
  {
    value: "ensiapukortti",
    label: "Ensiapukortti",
    desc: "First aid certificate",
  },
  {
    value: "ajokortti",
    label: "Ajokortti (B)",
    desc: "Driver's license category B",
  },
];

export function PublicProfileCard() {
  const { user, updateProfile, isLoading } = useUser();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    bio: user?.publicProfile?.bio ?? "",
    skills: user?.publicProfile?.skills ?? ([] as PublicProfileSkill[]),
    certificates:
      user?.publicProfile?.certificates ?? ([] as PublicProfileCertificate[]),
    languages: user?.publicProfile?.languages ?? ([] as PublicProfileLang[]),
  });

  const openDialog = () => {
    setForm({
      bio: user?.publicProfile?.bio ?? "",
      skills: user?.publicProfile?.skills ?? [],
      certificates: user?.publicProfile?.certificates ?? [],
      languages: user?.publicProfile?.languages ?? [],
    });
    setError("");
    setOpen(true);
  };

  const toggleItem = (
    field: "skills" | "certificates" | "languages",
    value: string,
  ) => {
    setForm((p) => ({
      ...p,
      [field]: p[field].includes(value)
        ? p[field].filter((v) => v !== value)
        : [...p[field], value],
    }));
  };

  const handleSave = async () => {
    setError("");
    try {
      await updateProfile({ publicProfile: form });
      setOpen(false);
    } catch (e) {
      setError(getAxiosError(e));
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
      <div className="rounded-xl border border-border bg-background p-4">
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
            <div className="tiptap tiptap-none">
              {p?.bio ? parse(p?.bio) : "—"}
            </div>
          </div>
          <div className="h-px bg-border" />
          <div>
            <p className="text-xs text-grey mb-2">Skills</p>
            {p?.skills?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {p.skills.map((s) => (
                  <span
                    key={s}
                    className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium"
                  >
                    {s}
                  </span>
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
                  const cert = CERTIFICATES.find((x) => x.value === c.value);
                  return (
                    <span
                      key={c.value}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 font-medium"
                    >
                      <BadgeCheck className="w-3.5 h-3.5" />
                      {cert?.label}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-grey">No certificates added yet.</p>
            )}
          </div>
          <div className="h-px bg-border" />
          <div>
            <p className="text-xs text-grey mb-2">Languages</p>
            {p?.languages?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {p.languages.map((l) => (
                  <span
                    key={l.value}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-muted text-foreground font-medium"
                  >
                    {l.label}
                    <span className="text-[10px] text-grey font-normal">
                      {l.level}
                    </span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-grey">No languages added yet.</p>
            )}
          </div>
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit public profile</DialogTitle>
            <DialogDescription>
              This is what clients see when they browse taskers.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-5 py-2">
            <FormField label="About me">
              <Tiptap
                value={form.bio}
                onUpdate={({ editor }) => {
                  setForm((prev) => ({
                    ...prev,
                    bio: editor.getHTML(),
                  }));
                }}
              />
              <p className="text-xs text-grey text-right mt-1">
                {form.bio.length}/1000
              </p>
            </FormField>
            <div className="h-px bg-border" />
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {SKILL_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleItem("skills", s)}
                    className={clsx(
                      "text-xs px-2.5 py-1 rounded-full border transition-colors",
                      form.skills.includes(s)
                        ? "bg-primary text-white border-primary"
                        : "bg-background text-foreground border-border hover:border-primary/50",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-px bg-border" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">
                Certificates
              </p>
              <p className="text-xs text-grey mb-2">
                Add certificates you hold — increases trust with clients.
              </p>
              <div className="flex flex-col gap-2">
                {CERTIFICATES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => toggleItem("certificates", c.value)}
                    className={clsx(
                      "flex items-center justify-between px-3 py-2.5 border text-left transition-colors",
                      form.certificates.includes(c.value)
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-accent/40",
                    )}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {c.label}
                      </p>
                      <p className="text-xs text-grey">{c.desc}</p>
                    </div>
                    {form.certificates.includes(c.value) && (
                      <BadgeCheck className="w-4 h-4 text-accent shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-px bg-border" />
            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                Languages
              </p>
              <LanguagesEditor
                value={form.languages}
                onChange={(langs) =>
                  setForm((p) => ({ ...p, languages: langs }))
                }
              />
            </div>
          </div>
          {error && <p className="text-xs text-red">{error}</p>}
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

export function AvatarCard() {
  const { user, updatePublicProfile, isLoading } = useUser();
  const [error, setError] = useState("");

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // TODO: upload file, get URL, then updatePublicProfile({ avatar: url })
  };

  if (!user) return null;

  const initials = (user.profile?.fullName ?? user.username)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 items-start">
      <SectionCard
        icon={<Plus className="w-6 h-6 text-background" />}
        title="Profile photo"
        desc="Your avatar shown to clients and on your public profile."
      />
      <div className="rounded-xl border border-border bg-background p-4">
        <div className="flex items-center gap-4">
          {user.profile?.avatar ? (
            <Image
              src={user.profile.avatar}
              alt={user.profile.fullName}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-lg font-medium shrink-0">
              {initials}
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-primary hover:underline underline-offset-2 cursor-pointer">
              Change photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
            <p className="text-xs text-grey mt-0.5">JPG, PNG — max 2MB</p>
          </div>
        </div>
        {error && <p className="text-xs text-red mt-3">{error}</p>}
      </div>
    </div>
  );
}
