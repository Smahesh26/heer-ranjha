import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { json, badRequest } from "@/lib/http";

export const dynamic = "force-dynamic";

function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return expected === signature;
}

export async function POST(request) {
  const signature = request.headers.get("x-razorpay-signature");
  const rawBody = await request.text();

  if (!verifyWebhookSignature(rawBody, signature)) {
    return badRequest("Invalid webhook signature");
  }

  let payload;
  try {
    payload = JSON.parse(rawBody || "{}");
  } catch {
    return badRequest("Invalid webhook payload");
  }
  const event = payload?.event || "";

  const payment = payload?.payload?.payment?.entity;
  const order = payload?.payload?.order?.entity;

  const providerOrderId = payment?.order_id || order?.id || null;
  const providerPaymentId = payment?.id || null;

  const linkedOrder = providerOrderId
    ? await prisma.order.findFirst({
        where: { razorpayOrderId: providerOrderId },
        select: { id: true, userId: true, total: true },
      })
    : null;

  const status = event.includes("captured") || event.includes("paid") ? "CAPTURED" : "CREATED";

  if (providerOrderId || providerPaymentId) {
    if (providerPaymentId) {
      await prisma.paymentTransaction.upsert({
        where: { providerPaymentId },
        update: {
          orderId: linkedOrder?.id || null,
          userId: linkedOrder?.userId || null,
          providerOrderId,
          amount: Number(payment?.amount || order?.amount || linkedOrder?.total || 0),
          currency: String(payment?.currency || order?.currency || "INR"),
          status,
          paymentMethod: payment?.method || "razorpay",
          rawResponse: JSON.stringify(payload),
        },
        create: {
          orderId: linkedOrder?.id || null,
          userId: linkedOrder?.userId || null,
          provider: "RAZORPAY",
          providerOrderId,
          providerPaymentId,
          providerSignature: signature || null,
          amount: Number(payment?.amount || order?.amount || linkedOrder?.total || 0),
          currency: String(payment?.currency || order?.currency || "INR"),
          status,
          paymentMethod: payment?.method || "razorpay",
          rawResponse: JSON.stringify(payload),
        },
      });
    } else if (providerOrderId) {
      await prisma.paymentTransaction.upsert({
        where: { providerOrderId },
        update: {
          orderId: linkedOrder?.id || null,
          userId: linkedOrder?.userId || null,
          amount: Number(order?.amount || linkedOrder?.total || 0),
          currency: String(order?.currency || "INR"),
          status,
          paymentMethod: "razorpay",
          rawResponse: JSON.stringify(payload),
        },
        create: {
          orderId: linkedOrder?.id || null,
          userId: linkedOrder?.userId || null,
          provider: "RAZORPAY",
          providerOrderId,
          providerSignature: signature || null,
          amount: Number(order?.amount || linkedOrder?.total || 0),
          currency: String(order?.currency || "INR"),
          status,
          paymentMethod: "razorpay",
          rawResponse: JSON.stringify(payload),
        },
      });
    }
  }

  if (linkedOrder?.id && status === "CAPTURED") {
    await prisma.order.update({
      where: { id: linkedOrder.id },
      data: {
        paymentStatus: "paid",
        paymentMode: payment?.method || "razorpay",
        razorpayPaymentId: providerPaymentId || null,
      },
    });
  }

  return json({ ok: true });
}
