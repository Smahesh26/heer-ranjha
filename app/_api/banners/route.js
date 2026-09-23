import { prisma } from "@/lib/prisma";
import { json, badRequest } from "@/lib/http";
import { bannerSchema } from "@/lib/validators";
import { cookies } from "next/headers";
import { access } from "fs/promises";
import { constants } from "fs";
import path from "path";
import { getAuthCookieName, verifyAuthToken } from "@/lib/auth";
import { uploadBannerMedia } from "@/lib/banner-media";

export const dynamic = "force-dynamic";

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

async function normalizeBannerMedia(banners) {
  return Promise.all(
    banners.map(async (banner) => {
      if (typeof banner.image !== "string" || !banner.image.startsWith("/uploads/")) {
        return banner;
      }

      const relativePath = banner.image.replace(/^\/+/, "");
      const absolutePath = path.join(process.cwd(), "public", relativePath);

      try {
        await access(absolutePath, constants.F_OK);
        return banner;
      } catch {
        return { ...banner, image: "" };
      }
    })
  );
}

export async function GET() {
  const banners = await prisma.banner.findMany({ orderBy: [{ position: "asc" }, { createdAt: "desc" }] });
  const safeBanners = await normalizeBannerMedia(banners);
  return json({ banners: safeBanners });
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
    let uploadedMedia = formData.get("image")?.toString() || "";
    if (mediaFile instanceof File) {
      try {
        uploadedMedia = await uploadBannerMedia(mediaFile);
      } catch (error) {
        return badRequest(error?.message || "Unable to process banner media upload");
      }
    }
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
