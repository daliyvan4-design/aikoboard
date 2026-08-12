import { describe, it, expect } from "vitest";
import { checkDataUriImage, MAX_IMAGE_BYTES } from "@/lib/validation";

function dataUri(mime: string, bytes: number): string {
  // 4 caracteres base64 = 3 octets
  const b64 = "A".repeat(Math.ceil(bytes / 3) * 4);
  return `data:${mime};base64,${b64}`;
}

describe("checkDataUriImage", () => {
  it("accepte un JPEG raisonnable", () => {
    const result = checkDataUriImage(dataUri("image/jpeg", 1024));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.mime).toBe("image/jpeg");
  });

  it("refuse un type MIME non autorise", () => {
    const result = checkDataUriImage(dataUri("application/pdf", 1024));
    expect(result.ok).toBe(false);
  });

  it("refuse un SVG (vecteur d'injection)", () => {
    expect(checkDataUriImage(dataUri("image/svg+xml", 512)).ok).toBe(false);
  });

  it("refuse une image au-dela de 5 Mo", () => {
    const result = checkDataUriImage(dataUri("image/png", MAX_IMAGE_BYTES + 1024));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/volumineuse/i);
  });

  it("refuse ce qui n'est pas un data-URI", () => {
    expect(checkDataUriImage("https://exemple.com/photo.jpg").ok).toBe(false);
    expect(checkDataUriImage("").ok).toBe(false);
    expect(checkDataUriImage(42).ok).toBe(false);
    expect(checkDataUriImage(null).ok).toBe(false);
  });

  it("refuse une image vide", () => {
    expect(checkDataUriImage("data:image/png;base64,").ok).toBe(false);
  });
});
