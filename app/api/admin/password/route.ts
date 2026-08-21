import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAnyAdmin } from "@/lib/admin-auth";
import bcrypt from "bcryptjs";
import { MIN_PASSWORD_LENGTH } from "@/lib/validation";

export async function PATCH(request: NextRequest) {
  // Self-service, borne a son propre compte : un scanner aussi doit
  // pouvoir changer son mot de passe.
  const { session, error } = await requireAnyAdmin();
  if (error) return error;

  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || typeof currentPassword !== "string") {
    return NextResponse.json({ error: "Mot de passe actuel requis" }, { status: 400 });
  }
  if (!newPassword || typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ error: "Le nouveau mot de passe doit faire au moins 10 caracteres" }, { status: 400 });
  }

  const userId = session!.user.id;

  const user = await prisma.adminUser.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.adminUser.update({ where: { id: userId }, data: { passwordHash: hash } });

  return NextResponse.json({ ok: true });
}
