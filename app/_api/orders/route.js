import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getAuthCookieName, verifyAuthToken } from "@/lib/auth";
import { json, badRequest, forbidden, unauthorized } from "@/lib/http";

export const dynamic = "force-dynamic";

function toSafeInt(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.trunc(parsed);
}

function buildReservationMap(items) {
  const map = new Map();

  for (const item of items) {
    const productId = String(item?.productId || "").trim();
    const quantity = toSafeInt(item?.quantity, 0);
    if (!productId || quantity < 1) {
      return null;
    }

    map.set(productId, (map.get(productId) || 0) + quantity);
  }

  return map;
}

async function getAuthUser() {
  const token = cookies().get(getAuthCookieName())?.value;
  if (!token) return null;

  try {
    const decoded = verifyAuthToken(token);
    if (!decoded?.sub) return null;

    return prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, role: true, name: true, email: true },
    });
  } catch {
    return null;
  }
}

export async function GET(request) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") || "me";
  const wantsAll = scope === "all";
  const statusFilter = searchParams.get("status");
  const paymentFilter = searchParams.get("paymentStatus");
  const q = searchParams.get("q")?.trim();

  if (wantsAll && user.role !== "ADMIN") {
    return forbidden("Admin access required for all orders");
  }

  const where = {
    ...(wantsAll ? {} : { userId: user.id }),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(paymentFilter ? { paymentStatus: paymentFilter } : {}),
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q } },
            { shippingName: { contains: q } },
            { shippingEmail: { contains: q } },
            { razorpayPaymentId: { contains: q } },
          ],
        }
      : {}),
  };

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      user: { select: { id: true, name: true, email: true } },
      paymentTransactions: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
  return json({ orders });
}

export async function POST(request) {
  const authUser = await getAuthUser();
  if (!authUser) return unauthorized();

  const payload = await request.json().catch(() => null);
  if (!Array.isArray(payload?.items) || payload.items.length === 0) {
    return badRequest("Invalid order payload");
  }

  const userId = payload?.userId || authUser.id;
  if (authUser.role !== "ADMIN" && userId !== authUser.id) {
    return forbidden("You can only create orders for your own account");
  }

  const reservationMap = buildReservationMap(payload.items);
  if (!reservationMap) {
    return badRequest("Each order item must include valid productId and quantity >= 1");
  }

  const reserveEntries = Array.from(reservationMap.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
    for (const reservation of reserveEntries) {
      const reserved = await tx.product.updateMany({
        where: {
          id: reservation.productId,
          active: true,
          stock: { gte: reservation.quantity },
        },
        data: {
          stock: { decrement: reservation.quantity },
        },
      });

      if (reserved.count !== 1) {
        throw new Error(`INSUFFICIENT_STOCK:${reservation.productId}`);
      }
    }

    const createdOrder = await tx.order.create({
      data: {
        orderNumber: payload.orderNumber || `HR-${Date.now()}`,
        userId,
        subtotal: payload.subtotal || 0,
        discount: payload.discount || 0,
        shippingFee: payload.shippingFee || 0,
        tax: payload.tax || 0,
        total: payload.total || 0,
        paymentMode: payload.paymentMode || "razorpay",
        couponCode: payload.couponCode || null,
        shippingName: payload.shippingName || "",
        shippingEmail: payload.shippingEmail || "",
        shippingPhone: payload.shippingPhone || null,
        shippingAddress: payload.shippingAddress || "",
        paymentStatus: payload.paymentStatus || "unpaid",
        razorpayOrderId: payload.razorpayOrderId || null,
      },
    });

    await tx.orderItem.createMany({
      data: payload.items.map((item) => ({
        orderId: createdOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        title: item.title,
        image: item.image || null,
      })),
    });

    if (payload.razorpayOrderId || payload.razorpayPaymentId || payload.paymentId) {
      await tx.paymentTransaction.create({
        data: {
          orderId: createdOrder.id,
          userId,
          provider: "RAZORPAY",
          providerOrderId: payload.razorpayOrderId || null,
          providerPaymentId: payload.razorpayPaymentId || payload.paymentId || null,
          amount: Number(payload.total || 0),
          currency: payload.currency || "INR",
          status: String(payload.paymentStatus || "CREATED").toUpperCase(),
          paymentMethod: payload.paymentMode || "razorpay",
          rawResponse: payload.paymentMeta ? JSON.stringify(payload.paymentMeta) : null,
        },
      });
    }

    const impactedProducts = await tx.product.findMany({
      where: {
        id: { in: reserveEntries.map((entry) => entry.productId) },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        stock: true,
        lowStockThreshold: true,
      },
    });

    const lowStockAlerts = impactedProducts
      .filter((product) => product.stock <= product.lowStockThreshold)
      .map((product) => ({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        stock: product.stock,
        threshold: product.lowStockThreshold,
        severity: product.stock === 0 ? "critical" : "warning",
      }));

    const fullOrder = await tx.order.findUnique({
      where: { id: createdOrder.id },
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true } },
        paymentTransactions: { orderBy: { createdAt: "desc" } },
      },
    });

      return { fullOrder, lowStockAlerts };
    });
  } catch (error) {
    if (typeof error?.message === "string" && error.message.startsWith("INSUFFICIENT_STOCK:")) {
      const productId = error.message.split(":")[1] || "unknown";
      return badRequest(`Insufficient stock for product ${productId}`);
    }

    throw error;
  }

  return json({ order: order.fullOrder, lowStockAlerts: order.lowStockAlerts }, { status: 201 });
}
