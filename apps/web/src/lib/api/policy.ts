import { BASE_URL } from "api/index";

export const getPolicyData = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/policy`);
    const json = await res.json();
    if (!json.success) return null;
    return json.data;
  } catch {
    return null;
  }
};
