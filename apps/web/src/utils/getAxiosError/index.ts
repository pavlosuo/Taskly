import axios from "axios";

export function getAxiosError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return (
      "errors:" +
      (err.response?.data?.message || err.message || "general.unknown")
    );
  }
  return "errors:general.unknown";
}
