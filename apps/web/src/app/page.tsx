import { getUser } from "api/get-user";
import { redirect } from "next/navigation";

export default async function Root() {
  const { user } = await getUser();
  if (!user) redirect("/login");
  redirect(user.role === "admin" ? "/dashboard" : "/profile");
}
