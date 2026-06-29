import { countries } from "country-codes-flags-phone-codes";
import * as flags from "country-flag-icons/react/3x2";
import { User } from "./types.ts";

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}

export const countryList = countries.map((c) => ({
  name: c.name,
  code: c.code,
  dial: c.dialCode,
  FlagComponent: flags[c.code as keyof typeof flags] ?? null,
}));

export type Country = (typeof countryList)[number];

export const finnishBanks = [
  { value: "op", label: "OP", src: "/banks/fi-op.svg" },
  { value: "nordea", label: "Nordea", src: "/banks/fi-nordea.svg" },
  { value: "s-pankki", label: "S-Pankki", src: "/banks/fi-spankki.svg" },
  {
    value: "danskebank",
    label: "Danske Bank",
    src: "/banks/fi-danskebank.svg",
  },
  {
    value: "saastopankki",
    label: "Säästöpankki",
    src: "/banks/fi-saastopankki.svg",
  },
  { value: "pop", label: "POP Pankki", src: "/banks/fi-pop.svg" },
  { value: "aktia", label: "Aktia", src: "/banks/fi-aktia.svg" },
  { value: "omasp", label: "OmaSp", src: "/banks/fi-omasp.svg" },
  {
    value: "alandsbanken",
    label: "Ålandsbanken",
    src: "/banks/fi-alandsbanken.svg",
  },
] as const;
