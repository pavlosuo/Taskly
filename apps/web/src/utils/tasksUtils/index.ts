import { Task, TaskListQuery, TaskFilters, NearFilter } from "shared/index";

const time = (value: unknown) => new Date(value as string).getTime() || 0;

const distanceKm = (a: NearFilter, b: NearFilter) => {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
};

export const applyTaskFilters = (
  tasks: Task[],
  f: TaskFilters,
  query = "",
): Task[] => {
  const q = query.trim().toLowerCase();
  const skillIds = new Set(f.skills.map((s) => s.value));
  const certIds = new Set(f.certificates.map((c) => c.value));

  const filtered = tasks.filter((t) => {
    if (f.status !== "all" && t.status !== f.status) return false;

    const amount = t.budget?.amount;
    if (f.minBudget > 0 && (amount === undefined || amount < f.minBudget)) {
      return false;
    }
    if (f.maxBudget > 0 && (amount === undefined || amount > f.maxBudget)) {
      return false;
    }
    if (f.onlyNegotiable && !t.budget?.negotiable) return false;

    if (skillIds.size && !t.skills?.some((s) => skillIds.has(s.value))) {
      return false;
    }
    if (certIds.size && !t.certificates?.some((c) => certIds.has(c.value))) {
      return false;
    }
    if (f.near) {
      if (!t.location?.lat || !t.location?.lng) return false;
      if (distanceKm(f.near, t.location) > f.radiusKm) return false;
    }
    if (q) {
      const haystack = `${t.title} ${t.description}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const byAmount = (t: Task) => t.budget?.amount ?? 0;

  switch (f.sort) {
    case "deadline":
      return [...filtered].sort((a, b) => time(a.deadline) - time(b.deadline));
    case "budget_desc":
      return [...filtered].sort((a, b) => byAmount(b) - byAmount(a));
    case "budget_asc":
      return [...filtered].sort((a, b) => byAmount(a) - byAmount(b));
    case "distance":
      return f.near
        ? [...filtered].sort(
            (a, b) =>
              distanceKm(f.near!, a.location) - distanceKm(f.near!, b.location),
          )
        : filtered;
    default:
      return [...filtered].sort(
        (a, b) => time(b.createdAt) - time(a.createdAt),
      );
  }
};

export const countActiveFilters = (f: TaskFilters) =>
  (f.sort !== "newest" ? 1 : 0) +
  (f.minBudget > 0 ? 1 : 0) +
  (f.maxBudget > 0 ? 1 : 0) +
  (f.onlyNegotiable ? 1 : 0) +
  (f.skills.length > 0 ? 1 : 0) +
  (f.certificates.length > 0 ? 1 : 0) +
  (f.near ? 1 : 0);

export const isFiltered = (f: TaskFilters, query = "") =>
  query.trim().length > 0 || f.status !== "all" || countActiveFilters(f) > 0;

export const buildTaskQuery = (
  query: string,
  f: TaskFilters,
): TaskListQuery => {
  const q: TaskListQuery = {};
  if (query.trim()) q.q = query.trim();
  if (f.skills.length) q.skill = f.skills.map((s) => s.value).join(",");
  if (f.certificates.length) {
    q.certificate = f.certificates.map((c) => c.value).join(",");
  }
  if (f.minBudget > 0) q.minBudget = f.minBudget;
  if (f.maxBudget > 0) q.maxBudget = f.maxBudget;
  if (f.onlyNegotiable) q.negotiable = true;
  if (f.near) {
    q.lat = f.near.lat;
    q.lng = f.near.lng;
    q.radiusKm = f.radiusKm;
  }
  if (f.sort !== "newest" && (f.sort !== "distance" || f.near)) {
    q.sort = f.sort;
  }
  return q;
};
