"use client";
import { useState, useEffect, useRef } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { Input } from "@/shared/components/Input";
import { axiosApi } from "api/index";
import { PublicProfileSkill } from "@shared/types";

export function SkillsEditor({
  value,
  onChange,
}: {
  value: PublicProfileSkill[];
  onChange: (skills: PublicProfileSkill[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<
    { _id: string; label: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>(0 as unknown as NodeJS.Timeout);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!search.trim()) {
      requestAnimationFrame(() => setSuggestions([]));
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await axiosApi.searchSkills(search);
        setSuggestions(data.items);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [search]);

  const addSkill = async (label: string) => {
    if (value.find((s) => s.label.toLowerCase() === label.toLowerCase())) {
      setSearch("");
      return;
    }
    try {
      const { data } = await axiosApi.upsertSkill(label);
      const skill = data.skill;
      onChange([...value, { value: skill._id, label: skill.label }]);
    } catch {
      onChange([...value, { value: label, label }]);
    }
    setSearch("");
    setSuggestions([]);
  };

  const removeSkill = (skillValue: string) => {
    onChange(value.filter((s) => s.value !== skillValue));
  };

  const exactMatch = suggestions.find(
    (s) => s.label.toLowerCase() === search.toLowerCase(),
  );

  const showAddButton = search.trim() && !exactMatch;

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((skill) => (
            <span
              key={skill.value}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium"
            >
              {skill.label}
              <button
                type="button"
                onClick={() => removeSkill(skill.value)}
                className="hover:text-red transition-colors ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Input
          type="text"
          name="search"
          placeholder="Search or add a skill..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && search.trim()) {
              e.preventDefault();
              addSkill(search.trim());
            }
          }}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-grey" />
        )}
      </div>
      {(suggestions.length > 0 || showAddButton) && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s._id}
              type="button"
              onClick={() => addSkill(s.label)}
              className="text-xs px-2.5 py-1 rounded-full border border-border text-foreground hover:border-primary/50 transition-colors bg-background"
            >
              {s.label}
            </button>
          ))}
          {showAddButton && (
            <button
              type="button"
              onClick={() => addSkill(search.trim())}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-dashed border-primary text-primary hover:bg-primary/5 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add &quot;{search.trim()}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
