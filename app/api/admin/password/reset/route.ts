import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rate-limit";
import { MIN_PASSWORD_LENGTH } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, "reset-password", 5, "60 s");
  if (limited) return limited;

  const { token, password } = await req.json();

  if (!token || typeof token !== "string" || !password || typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ error: "Token et mot de passe (min 10 caractères) requis" }, { status: 400 });
  }

  const user = await prisma.adminUser.findFirst({
    where: {
      resetToken: token,
      resetTokenExpires: { gt: new Date() },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Lien expiré ou invalide" }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);

  await prisma.adminUser.update({
    where: { id: user.id },
    data: {
      passwordHash: hash,
      resetToken: null,
      resetTokenExpires: null,
    },
  });

  return NextResponse.json({ ok: true });
}
