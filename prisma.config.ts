import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

/**
 * Configuration Prisma (remplace la clé `prisma` de package.json, dépréciée
 * et supprimée en Prisma 7).
 *
 * Attention : contrairement à l'ancienne configuration, le CLI ne charge
 * plus `.env` tout seul — d'où l'import de dotenv en tête de fichier.
 */
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
});
