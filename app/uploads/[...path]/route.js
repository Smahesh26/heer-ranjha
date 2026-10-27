import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const MIME_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".avif": "image/avif",
};

export async function GET(request, { params }) {
  try {
    const segments = params?.path || [];
    if (!segments.length) {
      return new Response("Not Found", { status: 404 });
    }

    const uploadsBase = path.join(process.cwd(), "public", "uploads");
    const requestedFile = path.resolve(uploadsBase, ...segments);

    // Prevent directory traversal attacks
    if (!requestedFile.startsWith(uploadsBase)) {
      return new Response("Forbidden", { status: 403 });
    }

    if (!fs.existsSync(requestedFile)) {
      return new Response("Media Not Found", { status: 404 });
    }

    const stat = await fs.promises.stat(requestedFile);
    if (!stat.isFile()) {
      return new Response("Not a File", { status: 400 });
    }

    const ext = path.extname(requestedFile).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    const fileBuffer = await fs.promises.readFile(requestedFile);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": stat.size.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("Error serving uploaded media:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
