import jwt from "jsonwebtoken";

const TOKEN_NAME = "heer_ranjha_token";
const DEFAULT_JWT_SECRET = "heer-ranjha-secret-jwt-key-2026";

export function getJwtSecret() {
  return process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
}

export function signAuthToken(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyAuthToken(token) {
  return jwt.verify(token, getJwtSecret());
}

export function getAuthCookieName() {
  return TOKEN_NAME;
}
