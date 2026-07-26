import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, "forgot-password", 3, "60 s");
  if (limited) return limited;

  const { email } = await req.json();

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Email requis" }, { status: 400 });
  }

  const user = await prisma.adminUser.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpires: expires },
  });

  const baseUrl = process.env.NEXTAUTH_URL || "https://aikoboard.com";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  await sendPasswordResetEmail({
    to: user.email,
    name: user.nom,
    resetUrl,
  });

  return NextResponse.json({ ok: true });
}
