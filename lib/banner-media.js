import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { Readable } from "stream";
import { v2 as cloudinary } from "cloudinary";

let cloudinaryConfigured = false;

function configureCloudinaryIfNeeded() {
  if (cloudinaryConfigured) return;

  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ secure: true });
    cloudinaryConfigured = true;
    return;
  }

  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    cloudinaryConfigured = true;
  }
}

export function isCloudinaryEnabled() {
  return Boolean(
    process.env.CLOUDINARY_URL
      || (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
  );
}

function getExtension(fileName) {
  const ext = path.extname(fileName || "").toLowerCase();
  return ext || ".bin";
}

async function saveUploadLocally(file) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadDir = path.join(process.cwd(), "public", "uploads", "banners");
  await mkdir(uploadDir, { recursive: true });
  const fileName = `${Date.now()}-${crypto.randomUUID()}${getExtension(file.name)}`;
  const filePath = path.join(uploadDir, fileName);
  await writeFile(filePath, buffer);
  return `/uploads/banners/${fileName}`;
}

async function uploadToCloudinary(file) {
  configureCloudinaryIfNeeded();

  const buffer = Buffer.from(await file.arrayBuffer());
  const resourceType = String(file.type || "").startsWith("video/") ? "video" : "image";

  const uploaded = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "heer-ranjha/banners",
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );

    Readable.from(buffer).pipe(stream);
  });

  return uploaded.secure_url;
}

function extractCloudinaryPublicId(mediaUrl) {
  if (typeof mediaUrl !== "string") return null;

  let parsed = null;
  try {
    parsed = new URL(mediaUrl);
  } catch {
    return null;
  }

  if (!parsed.hostname.includes("res.cloudinary.com")) return null;

  const pathName = parsed.pathname;
  const uploadIdx = pathName.indexOf("/upload/");
  if (uploadIdx < 0) return null;

  let assetPath = pathName.slice(uploadIdx + "/upload/".length);
  assetPath = assetPath.replace(/^v\d+\//, "");
  const dotIdx = assetPath.lastIndexOf(".");
  if (dotIdx > 0) {
    assetPath = assetPath.slice(0, dotIdx);
  }

  return decodeURIComponent(assetPath);
}

async function deleteCloudinaryMedia(mediaUrl, mediaType) {
  configureCloudinaryIfNeeded();

  const publicId = extractCloudinaryPublicId(mediaUrl);
  if (!publicId) return;

  if (mediaType === "video") {
    await cloudinary.uploader.destroy(publicId, { resource_type: "video" }).catch(() => {});
    return;
  }

  await cloudinary.uploader.destroy(publicId, { resource_type: "image" }).catch(() => {});
}

async function deleteLocalMedia(mediaUrl) {
  if (typeof mediaUrl !== "string" || !mediaUrl.startsWith("/uploads/")) return;

  const relativePath = mediaUrl.replace(/^\/+/, "");
  const absolutePath = path.join(process.cwd(), "public", relativePath);

  try {
    await unlink(absolutePath);
  } catch {
    // Ignore missing local files.
  }
}

export async function uploadBannerMedia(file) {
  if (!(file instanceof File)) return "";
  if (isCloudinaryEnabled()) {
    return uploadToCloudinary(file);
  }
  return saveUploadLocally(file);
}

export async function deleteBannerMedia(mediaUrl, mediaType) {
  if (!mediaUrl) return;

  if (isCloudinaryEnabled()) {
    await deleteCloudinaryMedia(mediaUrl, mediaType);
    return;
  }

  await deleteLocalMedia(mediaUrl);
}
