/**
 * Liste des nationalites proposee a l'inscription.
 *
 * Generee depuis les codes ISO 3166-1 (Intl.DisplayNames, libelles francais).
 * Les pays de la zone servie par AIKO remontent en tete : c'est la que se
 * trouvent la plupart des participants, et personne n'a envie de derouler
 * cent quatre-vingts lignes pour cocher "Côte d'Ivoire".
 */

export interface Country {
  code: string;
  nom: string;
}

/** Pays de la zone, proposes en premier. */
export const COUNTRIES_PRIORITY: Country[] = [
  {
    "code": "CI",
    "nom": "Côte d’Ivoire"
  },
  {
    "code": "SN",
    "nom": "Sénégal"
  },
  {
    "code": "BF",
    "nom": "Burkina Faso"
  },
  {
    "code": "ML",
    "nom": "Mali"
  },
  {
    "code": "GN",
    "nom": "Guinée"
  },
  {
    "code": "TG",
    "nom": "Togo"
  },
  {
    "code": "BJ",
    "nom": "Bénin"
  },
  {
    "code": "NE",
    "nom": "Niger"
  },
  {
    "code": "GH",
    "nom": "Ghana"
  },
  {
    "code": "NG",
    "nom": "Nigeria"
  },
  {
    "code": "CM",
    "nom": "Cameroun"
  },
  {
    "code": "GA",
    "nom": "Gabon"
  },
  {
    "code": "CD",
    "nom": "Congo-Kinshasa"
  },
  {
    "code": "MA",
    "nom": "Maroc"
  },
  {
    "code": "TN",
    "nom": "Tunisie"
  },
  {
    "code": "DZ",
    "nom": "Algérie"
  },
  {
    "code": "FR",
    "nom": "France"
  }
];

/** Tous les autres, par ordre alphabetique. */
export const COUNTRIES_OTHER: Country[] = [
  {
    "code": "AF",
    "nom": "Afghanistan"
  },
  {
    "code": "ZA",
    "nom": "Afrique du Sud"
  },
  {
    "code": "AL",
    "nom": "Albanie"
  },
  {
    "code": "DE",
    "nom": "Allemagne"
  },
  {
    "code": "AD",
    "nom": "Andorre"
  },
  {
    "code": "AO",
    "nom": "Angola"
  },
  {
    "code": "AG",
    "nom": "Antigua-et-Barbuda"
  },
  {
    "code": "SA",
    "nom": "Arabie saoudite"
  },
  {
    "code": "AR",
    "nom": "Argentine"
  },
  {
    "code": "AM",
    "nom": "Arménie"
  },
  {
    "code": "AU",
    "nom": "Australie"
  },
  {
    "code": "AT",
    "nom": "Autriche"
  },
  {
    "code": "AZ",
    "nom": "Azerbaïdjan"
  },
  {
    "code": "BS",
    "nom": "Bahamas"
  },
  {
    "code": "BH",
    "nom": "Bahreïn"
  },
  {
    "code": "BD",
    "nom": "Bangladesh"
  },
  {
    "code": "BB",
    "nom": "Barbade"
  },
  {
    "code": "BE",
    "nom": "Belgique"
  },
  {
    "code": "BZ",
    "nom": "Belize"
  },
  {
    "code": "BT",
    "nom": "Bhoutan"
  },
  {
    "code": "BY",
    "nom": "Biélorussie"
  },
  {
    "code": "BO",
    "nom": "Bolivie"
  },
  {
    "code": "BA",
    "nom": "Bosnie-Herzégovine"
  },
  {
    "code": "BW",
    "nom": "Botswana"
  },
  {
    "code": "BR",
    "nom": "Brésil"
  },
  {
    "code": "BN",
    "nom": "Brunei"
  },
  {
    "code": "BG",
    "nom": "Bulgarie"
  },
  {
    "code": "BI",
    "nom": "Burundi"
  },
  {
    "code": "KH",
    "nom": "Cambodge"
  },
  {
    "code": "CA",
    "nom": "Canada"
  },
  {
    "code": "CV",
    "nom": "Cap-Vert"
  },
  {
    "code": "CL",
    "nom": "Chili"
  },
  {
    "code": "CN",
    "nom": "Chine"
  },
  {
    "code": "CY",
    "nom": "Chypre"
  },
  {
    "code": "CO",
    "nom": "Colombie"
  },
  {
    "code": "KM",
    "nom": "Comores"
  },
  {
    "code": "CG",
    "nom": "Congo-Brazzaville"
  },
  {
    "code": "KP",
    "nom": "Corée du Nord"
  },
  {
    "code": "KR",
    "nom": "Corée du Sud"
  },
  {
    "code": "CR",
    "nom": "Costa Rica"
  },
  {
    "code": "HR",
    "nom": "Croatie"
  },
  {
    "code": "CU",
    "nom": "Cuba"
  },
  {
    "code": "DK",
    "nom": "Danemark"
  },
  {
    "code": "DJ",
    "nom": "Djibouti"
  },
  {
    "code": "DM",
    "nom": "Dominique"
  },
  {
    "code": "EG",
    "nom": "Égypte"
  },
  {
    "code": "AE",
    "nom": "Émirats arabes unis"
  },
  {
    "code": "EC",
    "nom": "Équateur"
  },
  {
    "code": "ER",
    "nom": "Érythrée"
  },
  {
    "code": "ES",
    "nom": "Espagne"
  },
  {
    "code": "EE",
    "nom": "Estonie"
  },
  {
    "code": "SZ",
    "nom": "Eswatini"
  },
  {
    "code": "VA",
    "nom": "État de la Cité du Vatican"
  },
  {
    "code": "US",
    "nom": "États-Unis"
  },
  {
    "code": "ET",
    "nom": "Éthiopie"
  },
  {
    "code": "FJ",
    "nom": "Fidji"
  },
  {
    "code": "FI",
    "nom": "Finlande"
  },
  {
    "code": "GM",
    "nom": "Gambie"
  },
  {
    "code": "GE",
    "nom": "Géorgie"
  },
  {
    "code": "GR",
    "nom": "Grèce"
  },
  {
    "code": "GD",
    "nom": "Grenade"
  },
  {
    "code": "GT",
    "nom": "Guatemala"
  },
  {
    "code": "GQ",
    "nom": "Guinée équatoriale"
  },
  {
    "code": "GW",
    "nom": "Guinée-Bissau"
  },
  {
    "code": "GY",
    "nom": "Guyana"
  },
  {
    "code": "HT",
    "nom": "Haïti"
  },
  {
    "code": "HN",
    "nom": "Honduras"
  },
  {
    "code": "HU",
    "nom": "Hongrie"
  },
  {
    "code": "MH",
    "nom": "Îles Marshall"
  },
  {
    "code": "SB",
    "nom": "Îles Salomon"
  },
  {
    "code": "IN",
    "nom": "Inde"
  },
  {
    "code": "ID",
    "nom": "Indonésie"
  },
  {
    "code": "IQ",
    "nom": "Irak"
  },
  {
    "code": "IR",
    "nom": "Iran"
  },
  {
    "code": "IE",
    "nom": "Irlande"
  },
  {
    "code": "IS",
    "nom": "Islande"
  },
  {
    "code": "IL",
    "nom": "Israël"
  },
  {
    "code": "IT",
    "nom": "Italie"
  },
  {
    "code": "JM",
    "nom": "Jamaïque"
  },
  {
    "code": "JP",
    "nom": "Japon"
  },
  {
    "code": "JO",
    "nom": "Jordanie"
  },
  {
    "code": "KZ",
    "nom": "Kazakhstan"
  },
  {
    "code": "KE",
    "nom": "Kenya"
  },
  {
    "code": "KG",
    "nom": "Kirghizstan"
  },
  {
    "code": "KI",
    "nom": "Kiribati"
  },
  {
    "code": "KW",
    "nom": "Koweït"
  },
  {
    "code": "LA",
    "nom": "Laos"
  },
  {
    "code": "LS",
    "nom": "Lesotho"
  },
  {
    "code": "LV",
    "nom": "Lettonie"
  },
  {
    "code": "LB",
    "nom": "Liban"
  },
  {
    "code": "LR",
    "nom": "Liberia"
  },
  {
    "code": "LY",
    "nom": "Libye"
  },
  {
    "code": "LI",
    "nom": "Liechtenstein"
  },
  {
    "code": "LT",
    "nom": "Lituanie"
  },
  {
    "code": "LU",
    "nom": "Luxembourg"
  },
  {
    "code": "MK",
    "nom": "Macédoine du Nord"
  },
  {
    "code": "MG",
    "nom": "Madagascar"
  },
  {
    "code": "MY",
    "nom": "Malaisie"
  },
  {
    "code": "MW",
    "nom": "Malawi"
  },
  {
    "code": "MV",
    "nom": "Maldives"
  },
  {
    "code": "MT",
    "nom": "Malte"
  },
  {
    "code": "MU",
    "nom": "Maurice"
  },
  {
    "code": "MR",
    "nom": "Mauritanie"
  },
  {
    "code": "MX",
    "nom": "Mexique"
  },
  {
    "code": "FM",
    "nom": "Micronésie"
  },
  {
    "code": "MD",
    "nom": "Moldavie"
  },
  {
    "code": "MC",
    "nom": "Monaco"
  },
  {
    "code": "MN",
    "nom": "Mongolie"
  },
  {
    "code": "ME",
    "nom": "Monténégro"
  },
  {
    "code": "MZ",
    "nom": "Mozambique"
  },
  {
    "code": "MM",
    "nom": "Myanmar (Birmanie)"
  },
  {
    "code": "NA",
    "nom": "Namibie"
  },
  {
    "code": "NR",
    "nom": "Nauru"
  },
  {
    "code": "NP",
    "nom": "Népal"
  },
  {
    "code": "NI",
    "nom": "Nicaragua"
  },
  {
    "code": "NO",
    "nom": "Norvège"
  },
  {
    "code": "NZ",
    "nom": "Nouvelle-Zélande"
  },
  {
    "code": "OM",
    "nom": "Oman"
  },
  {
    "code": "UG",
    "nom": "Ouganda"
  },
  {
    "code": "UZ",
    "nom": "Ouzbékistan"
  },
  {
    "code": "PK",
    "nom": "Pakistan"
  },
  {
    "code": "PW",
    "nom": "Palaos"
  },
  {
    "code": "PA",
    "nom": "Panama"
  },
  {
    "code": "PG",
    "nom": "Papouasie-Nouvelle-Guinée"
  },
  {
    "code": "PY",
    "nom": "Paraguay"
  },
  {
    "code": "NL",
    "nom": "Pays-Bas"
  },
  {
    "code": "PE",
    "nom": "Pérou"
  },
  {
    "code": "PH",
    "nom": "Philippines"
  },
  {
    "code": "PL",
    "nom": "Pologne"
  },
  {
    "code": "PT",
    "nom": "Portugal"
  },
  {
    "code": "QA",
    "nom": "Qatar"
  },
  {
    "code": "CF",
    "nom": "République centrafricaine"
  },
  {
    "code": "DO",
    "nom": "République dominicaine"
  },
  {
    "code": "RO",
    "nom": "Roumanie"
  },
  {
    "code": "GB",
    "nom": "Royaume-Uni"
  },
  {
    "code": "RU",
    "nom": "Russie"
  },
  {
    "code": "RW",
    "nom": "Rwanda"
  },
  {
    "code": "KN",
    "nom": "Saint-Christophe-et-Niévès"
  },
  {
    "code": "SM",
    "nom": "Saint-Marin"
  },
  {
    "code": "VC",
    "nom": "Saint-Vincent-et-les Grenadines"
  },
  {
    "code": "LC",
    "nom": "Sainte-Lucie"
  },
  {
    "code": "SV",
    "nom": "Salvador"
  },
  {
    "code": "WS",
    "nom": "Samoa"
  },
  {
    "code": "ST",
    "nom": "Sao Tomé-et-Principe"
  },
  {
    "code": "RS",
    "nom": "Serbie"
  },
  {
    "code": "SC",
    "nom": "Seychelles"
  },
  {
    "code": "SL",
    "nom": "Sierra Leone"
  },
  {
    "code": "SG",
    "nom": "Singapour"
  },
  {
    "code": "SK",
    "nom": "Slovaquie"
  },
  {
    "code": "SI",
    "nom": "Slovénie"
  },
  {
    "code": "SO",
    "nom": "Somalie"
  },
  {
    "code": "SD",
    "nom": "Soudan"
  },
  {
    "code": "SS",
    "nom": "Soudan du Sud"
  },
  {
    "code": "LK",
    "nom": "Sri Lanka"
  },
  {
    "code": "SE",
    "nom": "Suède"
  },
  {
    "code": "CH",
    "nom": "Suisse"
  },
  {
    "code": "SR",
    "nom": "Suriname"
  },
  {
    "code": "SY",
    "nom": "Syrie"
  },
  {
    "code": "TJ",
    "nom": "Tadjikistan"
  },
  {
    "code": "TW",
    "nom": "Taïwan"
  },
  {
    "code": "TZ",
    "nom": "Tanzanie"
  },
  {
    "code": "TD",
    "nom": "Tchad"
  },
  {
    "code": "CZ",
    "nom": "Tchéquie"
  },
  {
    "code": "TH",
    "nom": "Thaïlande"
  },
  {
    "code": "TL",
    "nom": "Timor oriental"
  },
  {
    "code": "TO",
    "nom": "Tonga"
  },
  {
    "code": "TT",
    "nom": "Trinité-et-Tobago"
  },
  {
    "code": "TM",
    "nom": "Turkménistan"
  },
  {
    "code": "TR",
    "nom": "Turquie"
  },
  {
    "code": "TV",
    "nom": "Tuvalu"
  },
  {
    "code": "UA",
    "nom": "Ukraine"
  },
  {
    "code": "UY",
    "nom": "Uruguay"
  },
  {
    "code": "VU",
    "nom": "Vanuatu"
  },
  {
    "code": "VE",
    "nom": "Venezuela"
  },
  {
    "code": "VN",
    "nom": "Viêt Nam"
  },
  {
    "code": "YE",
    "nom": "Yémen"
  },
  {
    "code": "ZM",
    "nom": "Zambie"
  },
  {
    "code": "ZW",
    "nom": "Zimbabwe"
  }
];

export const COUNTRIES: Country[] = [...COUNTRIES_PRIORITY, ...COUNTRIES_OTHER];

/** Verifie qu'un code recu correspond bien a un pays connu. */
export function isKnownCountry(code: unknown): code is string {
  return typeof code === "string" && COUNTRIES.some((c) => c.code === code);
}

/** Libelle francais d'un code pays, ou le code lui-meme s'il est inconnu. */
export function countryName(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.nom ?? code;
}
