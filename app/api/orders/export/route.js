import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getAuthCookieName, verifyAuthToken } from "@/lib/auth";
import { forbidden, json, unauthorized } from "@/lib/http";

export const dynamic = "force-dynamic";

async function getAuthUser() {
  const token = cookies().get(getAuthCookieName())?.value;
  if (!token) return null;
  try {
    const decoded = verifyAuthToken(token);
    if (!decoded?.sub) return null;
    return prisma.user.findUnique({ where: { id: decoded.sub }, select: { id: true, role: true } });
  } catch {
    return null;
  }
}

function toCsv(orders) {
  const header = [
    "orderNumber",
    "customer",
    "email",
    "status",
    "paymentStatus",
    "paymentMode",
    "total",
    "createdAt",
  ];
  const rows = orders.map((o) => [
    o.orderNumber || o.id,
    o.shippingName || "",
    o.shippingEmail || "",
    o.status || "",
    o.paymentStatus || "",
    o.paymentMode || "",
    String(o.total || 0),
    o.createdAt?.toISOString?.() || "",
  ]);
  return [header, ...rows]
    .map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
    .join("\n");
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden("Admin access required");

  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });
  const csv = toCsv(orders);
  return json({ csv, count: orders.length });
}
