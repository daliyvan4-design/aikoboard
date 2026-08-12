import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/admin-auth";
import bcrypt from "bcryptjs";

export async function PATCH(request: NextRequest) {
  const { session, error } = await requireRole("ADMIN", "SUPERVISEUR", "CONCIERGE");
  if (error) return error;

  const body = await request.json();
  const userId = session!.user.id;

  const data: Record<string, string> = {};

  if (typeof body.nom === "string" && body.nom.trim()) {
    data.nom = body.nom.trim().substring(0, 100);
  }

  if (typeof body.email === "string" && body.email.trim()) {
    if (!body.currentPassword || typeof body.currentPassword !== "string") {
      return NextResponse.json({ error: "Mot de passe requis pour changer l'email" }, { status: 400 });
    }

    const user = await prisma.adminUser.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
    if (!valid) return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 400 });

    const newEmail = body.email.trim().toLowerCase();
    const existing = await prisma.adminUser.findUnique({ where: { email: newEmail } });
    if (existing && existing.id !== userId) {
      return NextResponse.json({ error: "Cet email est deja utilise" }, { status: 409 });
    }

    data.email = newEmail;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Rien a modifier" }, { status: 400 });
  }

  const updated = await prisma.adminUser.update({
    where: { id: userId },
    data,
  });

  return NextResponse.json({ nom: updated.nom, email: updated.email });
}
