import { BankItem } from "shared/index";

export const COUNTRY_CODES_LIST = ["fi"];

export const COUNTRY_PREFIX_IBAN = "FI";

export const IBAN_DIGIT_LENGTH = 16;

export const FINNISH_BANKS: BankItem[] = [
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
];

export const FINNISH_BANKS_VALUES: BankItem["value"][] = FINNISH_BANKS.map(
  (b) => b.value,
);
