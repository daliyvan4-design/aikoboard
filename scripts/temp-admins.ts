import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env", override: true });
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { PrismaClient, type Role } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Comptes temporaires pour l'audit responsive du back-office.
 * `create` les cree, `delete` les retire. Ils sont reconnaissables a leur
 * domaine pour qu'aucun compte reel ne puisse etre supprime par erreur.
 */

const DOMAIN = "@audit.aikoboard.local";
const ROLES: Role[] = ["ADMIN", "SUPERVISEUR", "CONCIERGE", "AGENT_INSTITUTIONNEL", "SCANNER"];

async function listAccounts(title: string) {
  const users = await prisma.adminUser.findMany({
    select: { email: true, role: true, actif: true },
    orderBy: { email: "asc" },
  });
  console.log(`\n${title} (${users.length} comptes) :`);
  for (const u of users) {
    const temp = u.email.endsWith(DOMAIN) ? "  <- temporaire" : "";
    console.log(`  ${u.email.padEnd(38)} ${u.role.padEnd(22)} ${u.actif ? "actif" : "inactif"}${temp}`);
  }
}

async function create() {
  await listAccounts("AVANT");

  const credentials: { email: string; password: string; role: Role }[] = [];

  for (const role of ROLES) {
    const email = `audit-${role.toLowerCase()}${DOMAIN}`;
    const password = randomBytes(12).toString("base64url");
    await prisma.adminUser.upsert({
      where: { email },
      update: { passwordHash: await bcrypt.hash(password, 10), role, actif: true },
      create: {
        email,
        nom: `Audit ${role}`,
        passwordHash: await bcrypt.hash(password, 10),
        role,
        actif: true,
      },
    });
    credentials.push({ email, password, role });
  }

  await listAccounts("APRES");
  console.log("\nIDENTIFIANTS (temporaires) :");
  console.log(JSON.stringify(credentials));
}

async function remove() {
  const deleted = await prisma.adminUser.deleteMany({
    where: { email: { endsWith: DOMAIN } },
  });
  console.log(`comptes temporaires supprimes : ${deleted.count}`);
  await listAccounts("ETAT FINAL");
}

const action = process.argv[2];
(action === "delete" ? remove() : create())
  .catch((e) => {
    console.error("ERREUR:", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
