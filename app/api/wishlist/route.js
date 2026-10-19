import { json, badRequest } from "@/lib/http";
export const dynamic = "force-dynamic";

export async function GET() { return json({ items: [] }); }
export async function POST() { return badRequest("Wishlist backend disabled in static mode."); }
export async function DELETE() { return json({ ok: true }); }
