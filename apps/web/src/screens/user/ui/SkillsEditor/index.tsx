"use client";
import { useTranslation } from "@/hooks/useTranslation";
import { axiosApi } from "@/api/index";
import { PublicProfileSkill } from "shared/index";
import { TagInput } from "@/components/shared/Input";
import { useCallback } from "react";

export function SkillsEditor({
  value,
  onChange,
  error,
}: {
  value: PublicProfileSkill[];
  onChange: (skills: PublicProfileSkill[]) => void;
  error?: string;
}) {
  const { t } = useTranslation("profile");

  const searchFn = useCallback(async (search: string) => {
    const { data } = await axiosApi.searchSkills(search);
    return data.items.map((skill) => ({
      value: skill._id,
      label: skill.label,
    }));
  }, []);

  const createFn = useCallback(async (label: string) => {
    const { data } = await axiosApi.upsertSkill(label);
    return {
      value: data._id,
      label: data.label,
    };
  }, []);

  return (
    <TagInput
      value={value}
      onChange={onChange}
      placeholder={t("skills.searchPlaceholder")}
      name="skills"
      error={error}
      hideErrorLabel
      searchFn={searchFn}
      createFn={createFn}
    />
  );
}
