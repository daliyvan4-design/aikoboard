// Config plate ESLint — remplace .eslintrc.json, que les versions récentes
// d'ESLint ne lisent plus, et `next lint`, retiré de Next 16.
import coreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "video/**",
      "prisma/migrations/**",
      "next-env.d.ts",
    ],
  },
  ...coreWebVitals,
];

export default config;
