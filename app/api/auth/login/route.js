import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { json, badRequest, unauthorized } from "@/lib/http";
import { loginSchema } from "@/lib/validators";
import { signAuthToken, getAuthCookieName } from "@/lib/auth";
import { sendLoginOtpEmail } from "@/lib/email";

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RATE_WINDOW_MS = 15 * 60 * 1000;
const OTP_MAX_REQUESTS_PER_WINDOW = 5;
const OTP_MAX_ATTEMPTS = 5;

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request) {
  const payload = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(payload);

  if (!parsed.success) {
    return badRequest("Invalid login data", parsed.error.flatten());
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return unauthorized("Invalid email or password");
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) {
    return unauthorized("Invalid email or password");
  }

  if (!parsed.data.otp) {
    const now = Date.now();
    const windowStart = new Date(now - OTP_RATE_WINDOW_MS);
    const recentCount = await prisma.loginOtp.count({
      where: {
        userId: user.id,
        createdAt: { gte: windowStart },
      },
    });

    if (recentCount >= OTP_MAX_REQUESTS_PER_WINDOW) {
      return badRequest("Too many OTP requests. Please try again in 15 minutes.");
    }

    await prisma.loginOtp.updateMany({
      where: { userId: user.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    const otp = generateOtpCode();
    const codeHash = await bcrypt.hash(`${user.id}:${otp}`, 10);

    await prisma.loginOtp.create({
      data: {
        userId: user.id,
        email: user.email,
        codeHash,
        expiresAt: new Date(now + OTP_TTL_MS),
      },
    });

    try {
      await sendLoginOtpEmail({ to: user.email, name: user.name, otp });
    } catch {
      return badRequest("Unable to send OTP email right now. Please try again.");
    }

    return json({
      otpRequired: true,
      message: "OTP sent to your email. Please enter the 6-digit code.",
    });
  }

  const now = new Date();
  const otpRecord = await prisma.loginOtp.findFirst({
    where: {
      userId: user.id,
      consumedAt: null,
      expiresAt: { gte: now },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    return unauthorized("OTP expired or not found. Please request a new OTP.");
  }

  const otpOk = await bcrypt.compare(`${user.id}:${parsed.data.otp}`, otpRecord.codeHash);
  if (!otpOk) {
    const nextAttempts = otpRecord.attempts + 1;
    await prisma.loginOtp.update({
      where: { id: otpRecord.id },
      data: {
        attempts: nextAttempts,
        ...(nextAttempts >= OTP_MAX_ATTEMPTS ? { consumedAt: now } : {}),
      },
    });

    return unauthorized("Invalid OTP");
  }

  await prisma.loginOtp.update({
    where: { id: otpRecord.id },
    data: { consumedAt: now },
  });

  const token = signAuthToken({ sub: user.id, role: user.role, email: user.email });
  const response = json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl },
  });
  response.cookies.set(getAuthCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
