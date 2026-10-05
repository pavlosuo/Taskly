import { Metadata } from "next";
import { APP_NAME, PAGES_META, Lang } from "shared/index";

type MetadataInput = {
  title: string;
  description?: string;
};

export function getMetaData(
  { title, description }: MetadataInput,
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
