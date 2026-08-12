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
  {
    rules: {
      // Règles arrivées avec eslint-plugin-react-hooks 7 : elles signalent
      // du code existant (setState en fin d'effet, Date.now() au rendu) qui
      // n'est pas fautif au point de bloquer la CI. À repasser en "error"
      // une fois ces écrans nettoyés.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
];

export default config;
