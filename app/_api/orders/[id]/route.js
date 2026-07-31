import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getAuthCookieName, verifyAuthToken } from "@/lib/auth";
import { badRequest, json, forbidden, notFound, unauthorized } from "@/lib/http";

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

export async function GET(_, { params }) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      user: { select: { id: true, name: true, email: true } },
      paymentTransactions: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) return notFound("Order not found");
  if (authUser.role !== "ADMIN" && order.userId !== authUser.id) {
    return forbidden("You are not allowed to view this order");
  }

  return json({ order });
}

export async function PATCH(request, { params }) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();
  if (authUser.role !== "ADMIN") {
    return forbidden("Admin access required");
  }

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return badRequest("Invalid update payload");
  }

  const status = payload.status ? String(payload.status).toUpperCase() : undefined;
  const paymentStatus = payload.paymentStatus ? String(payload.paymentStatus).toLowerCase() : undefined;
  const existing = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true },
  });

  if (!existing) return notFound("Order not found");

  const nextStatus = status || existing.status;
  const shouldReleaseInventory =
    nextStatus === "CANCELLED" &&
    existing.status !== "CANCELLED" &&
    !existing.inventoryReleasedAt;

  const updated = await prisma.$transaction(async (tx) => {
    if (shouldReleaseInventory) {
      for (const item of existing.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    return tx.order.update({
      where: { id: params.id },
      data: {
        ...(status ? { status } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
        ...(payload.courierName !== undefined ? { courierName: payload.courierName || null } : {}),
        ...(payload.trackingNumber !== undefined ? { trackingNumber: payload.trackingNumber || null } : {}),
        ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
        ...(nextStatus === "CANCELLED" ? { cancelledAt: new Date() } : {}),
        ...(shouldReleaseInventory
          ? {
              inventoryReleasedAt: new Date(),
              inventoryReleaseReason: payload.inventoryReleaseReason || "ORDER_CANCELLED",
            }
          : {}),
      },
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true } },
        paymentTransactions: { orderBy: { createdAt: "desc" } },
      },
    });
  });

  return json({ order: updated, inventoryReleased: shouldReleaseInventory });
}
