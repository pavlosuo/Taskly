import { getUser } from "@/api/getUser";
import { redirect } from "next/navigation";

export default async function Root() {
  const user = await getUser();
  if (!user) redirect("/login");
  redirect("/profile");
}
