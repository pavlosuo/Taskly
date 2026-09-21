import { getServerApi } from "api/server";
import { redirect } from "next/navigation";
import { Role, PublicUser } from "@shared/types";

type RoleNested = "guest" | "admin" | Role;

const homePage: Record<RoleNested, string> = {
  guest: "/login",
  tasker: "/profile",
  client: "/profile",
  admin: "/dashboard",
};

export async function authGuard(
  requiredRoles: RoleNested[],
): Promise<PublicUser> {
  try {
    const axiosApi = await getServerApi();
    const { data } = await axiosApi.me();
    const { user } = data;
    const currentRole: RoleNested = user?.role ?? "guest";
    if (!requiredRoles.includes(currentRole)) {
      redirect(homePage[currentRole]);
    }
    return user;
  } catch (error) {
    console.error(error);
    redirect(homePage["guest"]);
  }
}
