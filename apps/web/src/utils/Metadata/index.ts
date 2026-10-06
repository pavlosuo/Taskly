import { Metadata } from "next";
import { APP_NAME, PAGES_META, Lang } from "shared/index";

export function getMetaData(
  {
    title,
    description,
  }: {
    title: string;
    description?: string;
  },
  lang: Lang = "en",
): Metadata {
  const formattedTitle = PAGES_META?.[title]?.[lang]?.title || title;
  const formattedDescription =
    PAGES_META?.[title]?.[lang]?.description || description;
  return {
    title: `${formattedTitle} | ${APP_NAME}`,
    description: formattedDescription,
  };
}
