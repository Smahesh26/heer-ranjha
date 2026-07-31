import { json } from "@/lib/http";
import { getAuthCookieName } from "@/lib/auth";

export async function POST() {
  const response = json({ ok: true });
  response.cookies.set(getAuthCookieName(), "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
