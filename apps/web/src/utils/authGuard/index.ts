import { getServerApi } from "@/api/server";
import { Role, PublicUser } from "shared/types";
import { redirect } from "next/navigation";

type RoleNested = "guest" | "admin" | Role;

const homePage: Record<RoleNested, string> = {
  guest: "/login",
  tasker: "/profile",
  client: "/profile",
  admin: "/dashboard",
};

export async function authGuard(
  requiredRoles: RoleNested[],
  currentPath?: string,
): Promise<PublicUser | null> {
  let user: PublicUser | null = null;
  try {
    const axiosApi = await getServerApi();
    const { data } = await axiosApi.me();
    user = data?.user ?? null;
  } catch {
    user = null;
  }
  const currentRole: RoleNested = user?.role ?? "guest";
  if (requiredRoles.includes("guest")) {
    if (!user) {
      return null;
    }
    const redirectTo = homePage[currentRole];
    if (currentPath === redirectTo) {
      return user;
    }
    redirect(redirectTo);
  }
  if (!user) {
    redirect("/login");
  }
  if (!requiredRoles.includes(currentRole)) {
    const redirectTo = homePage[currentRole];
    if (currentPath !== redirectTo) {
      redirect(redirectTo);
    }
  }
  return user;
}
