import { Metadata } from "next";
import { APP_NAME } from "shared/data";

type MetadataInput = {
  title: string;
  description: string;
};

export function getMetaData({ title, description }: MetadataInput): Metadata {
  return {
    title: `${title} | ${APP_NAME}`,
    description,
  };
}
