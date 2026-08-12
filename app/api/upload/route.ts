import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/cloudinary";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const blocked = await rateLimit(req, "upload", 10, "60 s");
    if (blocked) return blocked;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) ?? "events";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 5 Mo)" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Format non supporte (JPG, PNG, WebP)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { url } = await uploadImage(buffer, folder);

    return NextResponse.json({ success: true, url });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur upload";
    console.error("[upload] error:", msg);
    return NextResponse.json(
      { error: msg },
      { status: 500 },
    );
  }
}
