import { Metadata } from "next";
import { appName } from "@shared/data";

type MetadataInput = {
  title: string;
  description: string;
};

export function getMetaData({ title, description }: MetadataInput): Metadata {
  return {
    title: `${title} | ${appName}`,
    description,
  };
}
