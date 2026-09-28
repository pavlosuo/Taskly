"use client";
import { axiosApi } from "api/index";
import { PublicProfileSkill } from "@shared/types";
import { TagInput } from "@/shared/components/TagInput";

export function SkillsEditor({
  value,
  onChange,
}: {
  value: PublicProfileSkill[];
  onChange: (skills: PublicProfileSkill[]) => void;
}) {
  return (
    <TagInput
      value={value}
      onChange={onChange}
      placeholder="Search or add a skill..."
      name="skills"
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
