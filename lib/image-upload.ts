import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";

/** Photos are resized to fit this many pixels on their longest side — sharp on any
 * screen (the website shows them at most ~1000 px wide, ~2000 px on retina). */
const MAX_SIDE = 2000;
/** WebP/JPEG quality, 0–1. Looks the same as the original at screen size. */
const QUALITY = 0.82;
/** Images already this small and within MAX_SIDE are uploaded as they are. */
const SKIP_UNDER_BYTES = 300 * 1024;
/** Each upload has a unique (timestamped) path, so browsers can keep it for a year. */
const CACHE_CONTROL = "public, max-age=31536000, immutable";

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

/** Shrinks a phone/camera photo in the browser before upload: fits it within MAX_SIDE
 * and re-encodes it as WebP (or JPEG/PNG where the browser can't make WebP). Returns the
 * original file whenever shrinking isn't possible or wouldn't help (GIF, SVG, HEIC the
 * browser can't read, an already small image). */
export async function shrinkImage(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file); // applies the photo's EXIF rotation
  } catch {
    return file;
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= SKIP_UNDER_BYTES) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  let blob = await canvasToBlob(canvas, "image/webp");
  // Browsers without WebP encoding fall back to PNG; use JPEG for photos instead, but
  // keep PNG for PNG sources so transparent backgrounds survive.
  if (!blob || blob.type !== "image/webp") {
    blob = await canvasToBlob(canvas, file.type === "image/png" ? "image/png" : "image/jpeg");
  }
  if (!blob || blob.size >= file.size) return file;

  const ext = blob.type === "image/jpeg" ? "jpg" : blob.type.split("/")[1];
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}.${ext}`, { type: blob.type });
}

/** Shrinks the image, uploads it to `<folder>/<timestamp>_<name>` and returns its
 * download URL. */
export async function uploadImage(folder: string, file: File): Promise<string> {
  const image = await shrinkImage(file);
  const safeName = image.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageRef = ref(storage, `${folder}/${Date.now()}_${safeName}`);
  await uploadBytes(storageRef, image, {
    contentType: image.type,
    cacheControl: CACHE_CONTROL,
  });
  return getDownloadURL(storageRef);
}

/** Deletes the Storage file behind a Firebase download URL. Does nothing for URLs it can't parse. */
export function deleteImageByUrl(imageUrl: string): Promise<void> {
  const url = new URL(imageUrl);
  const pathMatch = url.pathname.match(/\/o\/(.+?)(\?|$)/);
  if (!pathMatch?.[1]) return Promise.resolve();
  const storagePath = decodeURIComponent(pathMatch[1]);
  return deleteObject(ref(storage, storagePath));
}
