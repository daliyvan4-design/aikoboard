import { v2 as cloudinary } from "cloudinary";

function ensureConfig() {
  if (!cloudinary.config().cloud_name) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
}

export { cloudinary };

export async function uploadImage(
  buffer: Buffer,
  folder: string,
): Promise<{ url: string; publicId: string }> {
  ensureConfig();

  const dataUri = `data:image/png;base64,${buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `aiko/${folder}`,
    resource_type: "image",
    transformation: [
      { quality: "auto", fetch_format: "auto" },
      { width: 1600, crop: "limit" },
    ],
  });

  return { url: result.secure_url, publicId: result.public_id };
}

export function optimizedUrl(url: string, width?: number): string {
  if (!url.includes("cloudinary.com")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto${width ? `,w_${width}` : ""}/`);
}
