import { getServerApi } from "api/server";
import { Role, PublicUser } from "@shared/types";
import { notFound, redirect } from "next/navigation";

type RoleNested = "guest" | "admin" | Role;

const homePage: Record<RoleNested, string> = {
  guest: "/login",
  tasker: "/profile",
  client: "/profile",
  admin: "/dashboard",
};

export async function authGuard(
  requiredRoles: RoleNested[],
): Promise<PublicUser | null> {
  try {
    const axiosApi = await getServerApi();
    const { data } = await axiosApi.me();
    const { user } = data;
    const currentRole: RoleNested = user?.role ?? "guest";
    if (!requiredRoles.includes(currentRole)) {
      redirect(homePage[currentRole]);
    }
    return user;
  } catch {
    notFound();
  }
}
