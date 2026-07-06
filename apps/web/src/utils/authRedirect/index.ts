import { getUser } from "api/get-user";
import { redirect } from "next/navigation";

export async function authRedirect(currentPath: string) {
  const user = await getUser();

  const expectedPath = !user
    ? "/login"
    : user.role === "admin"
      ? "/admin"
      : "/profile";

  if (currentPath !== expectedPath) {
    redirect(expectedPath);
  }

  return user;
}
