import jwt from "jsonwebtoken";

const TOKEN_NAME = "heer_ranjha_token";

export function signAuthToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}

export function verifyAuthToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

export function getAuthCookieName() {
  return TOKEN_NAME;
}
