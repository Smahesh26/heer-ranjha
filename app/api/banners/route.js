import { prisma } from "@/lib/prisma";
import { json, badRequest } from "@/lib/http";
import { bannerSchema } from "@/lib/validators";
import { cookies } from "next/headers";
import { mkdir, writeFile } from "fs/promises";
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

export async function GET() {
  const banners = await prisma.banner.findMany({ orderBy: [{ position: "asc" }, { createdAt: "desc" }] });
  return json({ banners });
}

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) {
    return json({ error: "Admin access required" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";
  let payload = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const mediaFile = formData.get("media");
    const uploadedMedia = mediaFile instanceof File ? await saveUpload(mediaFile) : formData.get("image")?.toString() || "";
    payload = {
      title: formData.get("title")?.toString() || "",
      subtitle: formData.get("subtitle")?.toString() || undefined,
      link: formData.get("link")?.toString() || undefined,
      active: formData.get("active") !== "false",
      position: Number(formData.get("position") || 0),
      image: uploadedMedia,
      mediaType: mediaFile instanceof File ? (mediaFile.type.startsWith("video/") ? "video" : "image") : "image",
    };
  } else {
    payload = await request.json().catch(() => null);
  }

  const parsed = bannerSchema.safeParse(payload);

  if (!parsed.success) {
    return badRequest("Invalid banner data", parsed.error.flatten());
  }

  const banner = await prisma.banner.create({
    data: {
      ...parsed.data,
      mediaType: parsed.data.mediaType || "image",
    },
  });
  return json({ banner }, { status: 201 });
}
