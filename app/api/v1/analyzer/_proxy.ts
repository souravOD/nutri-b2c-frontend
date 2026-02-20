// Shared proxy helper for analyzer API routes.
// Bypasses the Next.js rewrite proxy which has timeout issues with
// long-running LLM calls, using fetch() with explicit timeout instead.

const API_BASE = (
  process.env.API_BASE_URL ||
  "http://127.0.0.1:5000"
).replace(/\/+$/, "");

export async function proxyToBackend(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const target = `${API_BASE}${url.pathname}${url.search}`;

  console.log(`[proxy] ${req.method} ${url.pathname} -> ${target}`);

  const headers = new Headers();
  for (const [key, value] of req.headers) {
    const k = key.toLowerCase();
    if (k !== "host" && k !== "connection" && k !== "transfer-encoding") {
      headers.set(key, value);
    }
  }

  const reqBody =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.arrayBuffer()
      : undefined;

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body: reqBody,
      cache: "no-store",
    });

    console.log(`[proxy] upstream responded: ${upstream.status}`);
    const responseBody = await upstream.arrayBuffer();
    console.log(`[proxy] response body size: ${responseBody.byteLength}`);

    return new Response(responseBody, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (err: any) {
    console.error(`[proxy] fetch failed:`, err?.message, err?.cause);
    return Response.json(
      { error: "Backend proxy failed", detail: err?.message },
      { status: 502 },
    );
  }
}
