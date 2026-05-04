import axios from "axios";

export function getAxiosError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return (
      err.response?.data?.message || err.message || "Something went wrong."
    );
  }
  return "Something went wrong.";
}
