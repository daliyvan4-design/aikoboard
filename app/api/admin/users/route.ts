import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/admin-auth";
import { canManageRole } from "@/lib/roles";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { adminUserSchema } from "@/lib/validation";
import { sendWelcomeEmail } from "@/lib/email";

export async function GET() {
  const { session, error } = await requireRole("ADMIN", "SUPERVISEUR");
  if (error) return error;

  const users = await prisma.adminUser.findMany({
    select: { id: true, email: true, nom: true, role: true, actif: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  if (session!.user.role === "SUPERVISEUR") {
    return NextResponse.json(users.filter((u) => u.role === "CONCIERGE" || u.role === "AGENT_INSTITUTIONNEL" || u.role === "SCANNER"));
  }

  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireRole("ADMIN", "SUPERVISEUR");
  if (error) return error;

  const raw = await request.json();
  const parsed = adminUserSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { email, nom, password, role } = parsed.data;
  const targetRole = (role as Role) || "CONCIERGE";

  if (!canManageRole(session!.user.role, targetRole)) {
    return NextResponse.json({ error: "Vous ne pouvez pas créer ce rôle" }, { status: 403 });
  }

  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.adminUser.create({
    data: { email, nom, passwordHash: hash, role: targetRole },
  });

  sendWelcomeEmail({
    to: email,
    name: nom,
    role: targetRole,
    loginUrl: `${process.env.NEXTAUTH_URL || "https://aikoboard.com"}/login`,
  }).catch(() => {});

  return NextResponse.json({ id: user.id, email: user.email, nom: user.nom, role: user.role }, { status: 201 });
}
