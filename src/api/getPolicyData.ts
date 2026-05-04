import { BASE_URL } from "@/api";

export const getPolicyData = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/policy`);
    const json = await res.json();
    if (!json.success) return null;
    return json.data;
  } catch (e) {}
  return null;
};
