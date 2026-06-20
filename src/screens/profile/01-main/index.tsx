"use client";
import { useUser } from "providers/User";

export function Main() {
  const { user } = useUser();
  console.log(user);
  return <section></section>;
}
