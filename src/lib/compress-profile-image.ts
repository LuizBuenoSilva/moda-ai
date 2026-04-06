import { TARGET_MAX_DATA_URL_LENGTH } from "@/lib/profile-image-constants";

export async function compressProfileImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem.");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Imagem muito grande (máx. 10 MB).");
  }

  const bitmap = await createImageBitmap(file);
  const maxSide = 512;
  let w = bitmap.width;
  let h = bitmap.height;
  if (w > maxSide || h > maxSide) {
    const scale = maxSide / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível processar a imagem.");

  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  let quality = 0.82;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  for (let i = 0; i < 6 && dataUrl.length > TARGET_MAX_DATA_URL_LENGTH; i++) {
    quality -= 0.12;
    dataUrl = canvas.toDataURL("image/jpeg", Math.max(0.35, quality));
  }

  if (dataUrl.length > TARGET_MAX_DATA_URL_LENGTH * 1.15) {
    throw new Error("Não foi possível reduzir a foto o suficiente; tente outra imagem.");
  }

  return dataUrl;
}
