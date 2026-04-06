import { TARGET_MAX_DATA_URL_LENGTH } from "@/lib/profile-image-constants";

/** Margem extra para URLs http(s) antigas / edge cases */
export const MAX_PROFILE_IMAGE_DB_LENGTH = Math.max(TARGET_MAX_DATA_URL_LENGTH, 500_000);

export function normalizeProfileImageInput(
  raw: string | null | undefined
): string | null {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  if (s.length > MAX_PROFILE_IMAGE_DB_LENGTH) {
    throw new Error("Foto de perfil muito grande");
  }
  if (
    s.startsWith("data:image/jpeg") ||
    s.startsWith("data:image/png") ||
    s.startsWith("data:image/webp") ||
    s.startsWith("data:image/gif")
  ) {
    return s;
  }
  if (s.startsWith("https://") || s.startsWith("http://")) {
    return s;
  }
  throw new Error("Formato de foto inválido");
}
