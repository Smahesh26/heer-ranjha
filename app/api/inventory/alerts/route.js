import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getAuthCookieName, verifyAuthToken } from "@/lib/auth";
import { forbidden, json, unauthorized } from "@/lib/http";

export const dynamic = "force-dynamic";

function getAuthUser() {
  const token = cookies().get(getAuthCookieName())?.value;
  if (!token) return null;

  try {
    const decoded = verifyAuthToken(token);
    if (!decoded?.sub) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function GET() {
  const user = getAuthUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden("Admin access required");

  const products = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      stock: true,
      lowStockThreshold: true,
      updatedAt: true,
      active: true,
    },
    orderBy: [{ stock: "asc" }, { updatedAt: "desc" }],
  });

  const alerts = products
    .filter((product) => product.active && product.stock <= product.lowStockThreshold)
    .map((product) => ({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      stock: product.stock,
      threshold: product.lowStockThreshold,
      severity: product.stock === 0 ? "critical" : "warning",
      updatedAt: product.updatedAt,
    }));

  return json({
    alerts,
    count: alerts.length,
  });
}
