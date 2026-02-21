// Shared proxy helper for analyzer API routes.
// Bypasses the Next.js rewrite proxy which has timeout issues with
// long-running LLM calls, using fetch() with explicit timeout instead.

const API_BASE = (
  process.env.API_BASE_URL ||
  "http://127.0.0.1:5000"
).replace(/\/+$/, "");
const DEFAULT_TIMEOUT_MS = 60_000;

function getProxyTimeoutMs(): number {
  const parsed = Number(process.env.ANALYZER_PROXY_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

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
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), getProxyTimeoutMs());
    const upstream = await (async () => {
      try {
        return await fetch(target, {
          method: req.method,
          headers,
          body: reqBody,
          cache: "no-store",
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutHandle);
      }
    })();

    console.log(`[proxy] upstream responded: ${upstream.status}`);
    const responseBody = await upstream.arrayBuffer();
    console.log(`[proxy] response body size: ${responseBody.byteLength}`);

    return new Response(responseBody, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return Response.json(
        { error: "Backend proxy timeout", detail: "Upstream request timed out" },
        { status: 504 },
      );
    }

    const detail = err instanceof Error ? err.message : "Unknown upstream error";
    const cause = err instanceof Error && "cause" in err ? (err as { cause?: unknown }).cause : undefined;
    console.error(`[proxy] fetch failed:`, detail, cause);
    return Response.json(
      { error: "Backend proxy failed", detail },
      { status: 502 },
    );
  }
}
