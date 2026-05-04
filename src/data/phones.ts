import { countries } from "country-codes-flags-phone-codes";
import * as flags from "country-flag-icons/react/3x2";

export const countryList = countries.map((c) => ({
  name: c.name,
  code: c.code,
  dial: c.dialCode,
  FlagComponent: flags[c.code as keyof typeof flags] ?? null,
}));

export type Country = (typeof countryList)[number];
