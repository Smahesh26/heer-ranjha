import { prisma } from "@/lib/prisma";
import { json, badRequest, notFound } from "@/lib/http";
import { bannerSchema } from "@/lib/validators";
import { cookies } from "next/headers";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getAuthCookieName, verifyAuthToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getExtension(fileName) {
  const ext = path.extname(fileName || "").toLowerCase();
  return ext || ".bin";
}

async function saveUpload(file) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadDir = path.join(process.cwd(), "public", "uploads", "banners");
  await mkdir(uploadDir, { recursive: true });
  const fileName = `${Date.now()}-${crypto.randomUUID()}${getExtension(file.name)}`;
  const filePath = path.join(uploadDir, fileName);
  await writeFile(filePath, buffer);
  return `/uploads/banners/${fileName}`;
}

async function deleteLocalUpload(imagePath) {
  if (typeof imagePath !== "string" || !imagePath.startsWith("/uploads/")) return;

  const relativePath = imagePath.replace(/^\/+/, "");
  const absolutePath = path.join(process.cwd(), "public", relativePath);

  try {
    await unlink(absolutePath);
  } catch {
    // Ignore missing files in ephemeral environments.
  }
}

async function requireAdmin() {
  const token = cookies().get(getAuthCookieName())?.value;
  if (!token) return null;

  try {
    const decoded = verifyAuthToken(token);
    return decoded.role === "ADMIN" ? decoded : null;
  } catch {
    return null;
  }
}

function toBool(value) {
  if (value === null || value === undefined || value === "") return undefined;
  return value === true || value === "true";
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function cleanOptionalText(value) {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text ? text : undefined;
}

export async function PATCH(request, { params }) {
  const admin = await requireAdmin();
  if (!admin) {
    return json({ error: "Admin access required" }, { status: 401 });
  }

  const existing = await prisma.banner.findUnique({ where: { id: params.id } });
  if (!existing) {
    return notFound("Banner not found");
  }

  const contentType = request.headers.get("content-type") || "";
  let payload = null;
  let uploadedMedia = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const mediaFile = formData.get("media");

    if (mediaFile instanceof File) {
      uploadedMedia = await saveUpload(mediaFile);
    }

    payload = {
      title: cleanOptionalText(formData.get("title")),
      subtitle: cleanOptionalText(formData.get("subtitle")),
      link: cleanOptionalText(formData.get("link")),
      active: toBool(formData.get("active")),
      position: toNumber(formData.get("position")),
      image: uploadedMedia || undefined,
      mediaType: mediaFile instanceof File ? (mediaFile.type.startsWith("video/") ? "video" : "image") : undefined,
    };
  } else {
    payload = await request.json().catch(() => null);
  }

  const parsed = bannerSchema.partial().safeParse(payload);

  if (!parsed.success) {
    return badRequest("Invalid banner data", parsed.error.flatten());
  }

  const banner = await prisma.banner.update({
    where: { id: params.id },
    data: parsed.data,
  });

  if (uploadedMedia && existing.image && existing.image !== uploadedMedia) {
    await deleteLocalUpload(existing.image);
  }

  return json({ banner });
}

export async function DELETE(_, { params }) {
  const admin = await requireAdmin();
  if (!admin) {
    return json({ error: "Admin access required" }, { status: 401 });
  }

  const existing = await prisma.banner.findUnique({ where: { id: params.id } });
  if (!existing) {
    return notFound("Banner not found");
  }

  await prisma.banner.delete({ where: { id: params.id } });
  await deleteLocalUpload(existing.image);

  return json({ ok: true });
}
