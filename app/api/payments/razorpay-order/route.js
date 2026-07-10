import Razorpay from "razorpay";
import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getAuthCookieName, verifyAuthToken } from "@/lib/auth";
import { json, badRequest, unauthorized } from "@/lib/http";
import { razorpayOrderSchema } from "@/lib/validators";

function getClient() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

function getAuthUserId() {
  const token = cookies().get(getAuthCookieName())?.value;
  if (!token) return null;

  try {
    const decoded = verifyAuthToken(token);
    return decoded?.sub || null;
  } catch {
    return null;
  }
}

export async function POST(request) {
  const userId = getAuthUserId();
  if (!userId) return unauthorized();

  const payload = await request.json().catch(() => null);
  const parsed = razorpayOrderSchema.safeParse(payload);

  if (!parsed.success) {
    return badRequest("Invalid payment request", parsed.error.flatten());
  }

  const amountMajor = Number(parsed.data.amount || 0);
  const amountMinor = Math.max(1, Math.round(amountMajor * 100));

  const client = getClient();
  const order = await client.orders.create({
    amount: amountMinor,
    currency: parsed.data.currency,
    receipt: parsed.data.receipt || `receipt_${Date.now()}`,
    payment_capture: 1,
  });

  const appOrderId = parsed.data.orderId || null;
  if (appOrderId) {
    await prisma.order.update({
      where: { id: appOrderId },
      data: { razorpayOrderId: order.id, paymentMode: "razorpay" },
    }).catch(() => {});

    await prisma.paymentTransaction.upsert({
      where: { providerOrderId: order.id },
      update: {
        orderId: appOrderId,
        userId,
        amount: amountMajor,
        currency: parsed.data.currency || "INR",
        status: "CREATED",
        paymentMethod: "razorpay",
        rawResponse: JSON.stringify(order),
      },
      create: {
        orderId: appOrderId,
        userId,
        provider: "RAZORPAY",
        providerOrderId: order.id,
        amount: amountMajor,
        currency: parsed.data.currency || "INR",
        status: "CREATED",
        paymentMethod: "razorpay",
        rawResponse: JSON.stringify(order),
      },
    });
  }

  return json({ order });
}

export async function PUT(request) {
  const userId = getAuthUserId();
  if (!userId) return unauthorized();

  const payload = await request.json().catch(() => null);
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId, amount, currency, paymentMethod } = payload || {};

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return badRequest("Missing verification fields");
  }

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  const verified = expected === razorpaySignature;
  if (!verified) {
    return json({ verified: false });
  }

  const order = await prisma.order.findFirst({
    where: {
      OR: [
        orderId ? { id: orderId } : undefined,
        { razorpayOrderId },
      ].filter(Boolean),
      userId,
    },
    select: { id: true, total: true },
  });

  await prisma.paymentTransaction.upsert({
    where: { providerPaymentId: razorpayPaymentId },
    update: {
      orderId: order?.id || orderId || null,
      userId,
      providerOrderId: razorpayOrderId,
      providerSignature: razorpaySignature,
      amount: Number(amount || order?.total || 0),
      currency: currency || "INR",
      status: "CAPTURED",
      paymentMethod: paymentMethod || "razorpay",
      rawResponse: JSON.stringify(payload || {}),
    },
    create: {
      orderId: order?.id || orderId || null,
      userId,
      provider: "RAZORPAY",
      providerOrderId: razorpayOrderId,
      providerPaymentId: razorpayPaymentId,
      providerSignature: razorpaySignature,
      amount: Number(amount || order?.total || 0),
      currency: currency || "INR",
      status: "CAPTURED",
      paymentMethod: paymentMethod || "razorpay",
      rawResponse: JSON.stringify(payload || {}),
    },
  });

  if (order?.id) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "paid",
        paymentMode: paymentMethod || "razorpay",
        razorpayPaymentId,
      },
    });
  }

  return json({ verified: true, orderId: order?.id || orderId || null });
}
