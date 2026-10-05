"use client";
import { axiosApi } from "@/api/index";
import { PublicProfileSkill } from "shared/index";
import { TagInput } from "@/components/shared/Input";

export function SkillsEditor({
  value,
  onChange,
  error,
}: {
  value: PublicProfileSkill[];
  onChange: (skills: PublicProfileSkill[]) => void;
  error?: string;
}) {
  return (
    <TagInput
      value={value}
      onChange={onChange}
      placeholder="Search or add a skill..."
      name="skills"
      error={error}
      hideErrorLabel
      searchFn={async (search: string) => {
        const { data } = await axiosApi.searchSkills(search);
        return data.items.map((skill) => ({
          value: skill._id,
          label: skill.label,
        }));
      }}
      createFn={async (label: string) => {
        const { data } = await axiosApi.upsertSkill(label);
        return {
          value: data._id,
          label: data.label,
        };
      }}
    />
  );
}
