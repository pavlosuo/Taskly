import { authGuard } from "@/utils/authGuard";

export default async function Root() {
  await authGuard([], "/");
}
