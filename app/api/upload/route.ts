import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/cloudinary";
import { rateLimit } from "@/lib/rate-limit";
import { requireAnyAdmin } from "@/lib/admin-auth";
import { log } from "@/lib/logger";

const ALLOWED_FOLDERS = ["events", "residences", "profiles", "badges"];

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireAnyAdmin();
    if (error) return error;

    const blocked = await rateLimit(req, "upload", 10, "60 s");
    if (blocked) return blocked;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rawFolder = (formData.get("folder") as string) ?? "events";
    const folder = ALLOWED_FOLDERS.includes(rawFolder) ? rawFolder : "events";

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
  } catch (err) {
    log.error("Upload image impossible", { route: "POST /api/upload" }, err);
    return NextResponse.json(
      { error: "Erreur upload" },
      { status: 500 },
    );
  }
}
