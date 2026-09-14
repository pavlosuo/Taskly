import { getServerApi } from "api/server";
import { redirect } from "next/navigation";

export default async function Root() {
  const axiosApi = await getServerApi();
  const { data } = await axiosApi.me();
  const { user } = data;
  if (!user) redirect("/login");
  redirect(user.role === "admin" ? "/dashboard" : "/profile");
}
