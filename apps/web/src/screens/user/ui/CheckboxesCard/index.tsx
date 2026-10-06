"use client";
import { useState, ReactNode } from "react";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@/providers/UserProvider";
import { getAxiosError } from "@/utils/getAxiosError";
import { SectionCard } from "@/screens/user/ui";
import { FieldError } from "@/components/shared/FieldError";

export function CheckboxesCard({
  list,
  icon,
  title,
  desc,
}: {
  list: { key: string; label: string; desc: string }[];
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  const { user, updateProfile } = useUser();
  const [error, setError] = useState("");
  const [local, setLocal] = useState(() => user?.settings?.checkboxes ?? {});

  const toggle = async (key: string, value: boolean) => {
    const updated = { ...local, [key]: value };
    setLocal(updated);
    try {
      await updateProfile({
        settings: {
          ...user?.settings,
          checkboxes: updated,
        },
      });
    } catch (e) {
      setLocal(local);
      setError(getAxiosError(e));
    }
  };

  if (!user || !list) return null;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 items-start">
        <SectionCard icon={icon} title={title} desc={desc} />
        <div className="border border-border bg-background p-4 flex flex-col gap-4">
          {list.map((row, i) => (
            <div key={row.key}>
              {i > 0 && <div className="h-px bg-border mb-4" />}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-0.5">
                    {row.label}
                  </p>
                  <p className="text-xs text-grey">{row.desc}</p>
                </div>
                <Switch
                  checked={local[row.key as keyof typeof local] ?? true}
                  onCheckedChange={(v) => toggle(row.key, v)}
                />
              </div>
            </div>
          ))}
          <FieldError message={error} />
        </div>
      </div>
    </>
  );
}
