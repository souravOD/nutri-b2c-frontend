export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { proxyToBackend } from "../_proxy";

export async function POST(req: Request) {
  return proxyToBackend(req);
}
