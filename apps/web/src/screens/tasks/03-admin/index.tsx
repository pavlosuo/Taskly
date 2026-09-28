"use client";
import { TaskList } from "@shared/types";

export const Admin = ({ allItems, myItems, page, limit, total }: TaskList) => {
  return <div>{JSON.stringify({ allItems, myItems, page, limit, total })}</div>;
};
