import { NextResponse } from "next/server";

export function json(data, init = {}) {
  return NextResponse.json(data, init);
}

export function badRequest(message, details) {
  return json({ error: message, details }, { status: 400 });
}

export function unauthorized(message = "Unauthorized") {
  return json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return json({ error: message }, { status: 403 });
}

export function notFound(message = "Not found") {
  return json({ error: message }, { status: 404 });
}
