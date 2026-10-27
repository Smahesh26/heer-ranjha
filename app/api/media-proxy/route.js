import { extractDriveFileId } from "@/lib/excel-parser";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const driveIdParam = searchParams.get("id");
    const rawUrl = searchParams.get("url");

    let fileId = driveIdParam ? driveIdParam.trim() : null;
    if (!fileId && rawUrl) {
      fileId = extractDriveFileId(rawUrl);
    }

    if (!fileId) {
      if (!rawUrl) {
        return new Response("Missing image URL or Google Drive ID", { status: 400 });
      }

      // Proxy general external image if valid URL
      try {
        const parsed = new URL(rawUrl);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          return new Response("Invalid protocol", { status: 400 });
        }
        const extRes = await fetch(rawUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });
        if (!extRes.ok) {
          return new Response("Upstream image error", { status: extRes.status });
        }
        const contentType = extRes.headers.get("content-type") || "image/jpeg";
        const buffer = await extRes.arrayBuffer();
        return new Response(buffer, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          },
        });
      } catch {
        return new Response("Failed to fetch image", { status: 500 });
      }
    }

    // Try Google Drive endpoints
    const candidateUrls = [
      `https://lh3.googleusercontent.com/d/${fileId}`,
      `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`,
      `https://drive.google.com/uc?export=download&id=${fileId}`,
    ];

    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, {
          redirect: "follow",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
          },
        });

        if (res.ok) {
          const contentType = res.headers.get("content-type") || "";
          if (contentType.startsWith("image/") || contentType.includes("octet-stream")) {
            const buffer = await res.arrayBuffer();
            if (buffer.byteLength > 500) {
              return new Response(buffer, {
                status: 200,
                headers: {
                  "Content-Type": contentType.startsWith("image/") ? contentType : "image/jpeg",
                  "Cache-Control": "public, max-age=604800, immutable",
                },
              });
            }
          }
        }
      } catch {
        // try next candidate
      }
    }

    return new Response("Could not load Google Drive image. Ensure link sharing is set to Anyone with the link.", {
      status: 404,
    });
  } catch (err) {
    console.error("Media proxy error:", err);
    return new Response("Media proxy error", { status: 500 });
  }
}
