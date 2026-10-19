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

    return prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, role: true },
    });
  } catch {
    return null;
  }
}

export async function GET(request) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();
  if (authUser.role !== "ADMIN") return forbidden("Admin access required");

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
            { phone: { contains: q } },
          ],
        }
      : {},
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      createdAt: true,
      orders: {
        select: {
          id: true,
          total: true,
          paymentStatus: true,
        },
      },
    },
  });

  const mapped = users.map((user) => {
    const orderCount = user.orders.length;
    const paidOrders = user.orders.filter((order) => String(order.paymentStatus || "").toLowerCase() === "paid");
    const totalSpend = paidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      createdAt: user.createdAt,
      orderCount,
      paidOrderCount: paidOrders.length,
      totalSpend,
    };
  });

  return json({ users: mapped });
}
