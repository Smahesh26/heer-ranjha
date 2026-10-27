import jwt from "jsonwebtoken";
import { cookies, headers } from "next/headers";

const TOKEN_NAME = "heer_ranjha_token";
const DEFAULT_JWT_SECRET = "heer-ranjha-secret-jwt-key-2026";

export function getJwtSecret() {
  return process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
}

export function signAuthToken(payload, options = {}) {
  const expiresIn = options.expiresIn || "7d";
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
}

export function signAdminAuthToken(payload) {
  // Admin session token strictly expires in 30 minutes (1800s)
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "30m" });
}

export function verifyAuthToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
}

export function getAuthCookieName() {
  return TOKEN_NAME;
}

export function getAuthCookieOptions(request, maxAgeSeconds = 60 * 60 * 24 * 7) {
  let isHttps = false;
  if (request) {
    const proto = request.headers?.get?.("x-forwarded-proto");
    isHttps = proto === "https" || (typeof request.url === "string" && request.url.startsWith("https:"));
  }
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: Boolean(isHttps),
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function getAdminAuthCookieOptions(request) {
  // 30 minutes in seconds = 1800s
  return getAuthCookieOptions(request, 30 * 60);
}

export function extractAuthToken(request) {
  // 1. Direct request Authorization header
  if (request?.headers?.get) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      return authHeader.substring(7).trim();
    }
  }

  // 2. next/headers Authorization header
  try {
    const headerList = headers();
    const authHeader = headerList.get("authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      return authHeader.substring(7).trim();
    }
  } catch {}

  // 3. next/headers Cookie
  try {
    const cookieStore = cookies();
    const token =
      cookieStore.get(TOKEN_NAME)?.value ||
      cookieStore.get("hr_auth_token")?.value;
    if (token) return token;
  } catch {}

  return null;
}

export function getAuthSession(request) {
  const token = extractAuthToken(request);
  if (!token) return null;
  return verifyAuthToken(token);
}

export function getAdminSession(request) {
  const decoded = getAuthSession(request);
  if (decoded && (decoded.role === "ADMIN" || decoded.email === "admin@heerranjha.com")) {
    return decoded;
  }
  return null;
}
