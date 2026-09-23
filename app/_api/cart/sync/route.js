import { json } from "@/lib/http";
export const dynamic = "force-dynamic";

export async function POST() { return json({ ok: true }); }
