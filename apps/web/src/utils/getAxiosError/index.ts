import axios from "axios";

export function getAxiosError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const error =
      err.response?.data?.message || err.message || "general.unknown";
    if (error === "Network Error") {
      return "errors:general.unknown";
    }
    return "errors:" + error;
  }
  return "errors:general.unknown";
}
