import { BASE_URL } from "api/index";
import { PolicyData } from "@shared/types";

export const getPolicyData = async (): Promise<PolicyData> => {
  try {
    const res = await fetch(`${BASE_URL}/api/policy`);
    const json = await res.json();
    if (!json.success)
      return { policyTitle: "", policyContent: "", updatedAt: undefined };
    return json.data;
  } catch {
    return { policyTitle: "", policyContent: "", updatedAt: undefined };
  }
};
