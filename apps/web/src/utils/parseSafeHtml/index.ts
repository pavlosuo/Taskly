import DOMPurify from "isomorphic-dompurify";
import htmlReactParser, {
  type HTMLReactParserOptions,
} from "html-react-parser";

export default function parseSafeHtml(
  html: string,
  options?: HTMLReactParserOptions,
) {
  const cleanHtml = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
  });
  return htmlReactParser(cleanHtml, options);
}
