import { getPageViews, incrementPageViews, getAllPageViews } from "@/lib/page-views";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const url = new URL(request.url);
  const pathParam = url.searchParams.get("path");

  if (!pathParam) {
    const all = await getAllPageViews();
    return json(all);
  }

  const views = await getPageViews(pathParam);
  const all = await getAllPageViews();

  return json({
    path: pathParam,
    views,
    totalViews: all.total,
  });
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawPath = body.path || "/";
    const shouldIncrement = body.increment !== false;

    const views = shouldIncrement ? await incrementPageViews(rawPath) : await getPageViews(rawPath);
    const all = await getAllPageViews();

    return json({
      path: rawPath,
      views,
      totalViews: all.total,
    });
  } catch (err) {
    console.error("Error in views route:", err);
    return json({ path: "/", views: 0, totalViews: 0 });
  }
}
