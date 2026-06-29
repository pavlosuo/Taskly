import { Metadata } from "next";

type MetadataInput = {
  title: string;
  description: string;
};

export function getMetaData({ title, description }: MetadataInput): Metadata {
  return {
    title: `${title} | Taskly`,
    description,
    icons: {
      icon: {
        url: "/favicon.ico",
        href: "/favicon.ico",
      },
    },
  };
}
