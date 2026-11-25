import axios from "axios";

export function getAxiosError(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const error = e.response?.data?.message || e.message || "general.unknown";
    if (error === "Network Error") {
      return "errors:general.unknown";
    }
    return "errors:" + error;
  }
  return "errors:general.unknown";
}
