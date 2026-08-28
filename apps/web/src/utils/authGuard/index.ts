import { getUser } from "api/get-user";
import { redirect } from "next/navigation";
import { Role } from "@shared/types";

type RoleNested = "guest" | "admin" | Role;

const homePage: Record<RoleNested, string> = {
  guest: "/login",
  tasker: "/profile",
  client: "/profile",
  admin: "/admin",
};

export async function authGuard(requiredRoles: RoleNested[]) {
  const { user } = await getUser();
  const currentRole: RoleNested = user?.role ?? "guest";
  if (!requiredRoles.includes(currentRole)) {
    redirect(homePage[currentRole]);
  }
  return user;
}
