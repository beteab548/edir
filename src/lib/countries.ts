import countries from "world-countries";

export const countryList = countries.map((country) => ({
  code: country.cca2,
  name: country.name.common,
}));
