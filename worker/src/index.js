const CHANNEL_PATTERN = /^[A-Za-z0-9_-]{24}$/;
const MAX_BODY_BYTES = 2_000_000;
const DEFAULT_TTL_SECONDS = 30 * 24 * 60 * 60;

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const allowed = new Set(String(env.ALLOWED_ORIGINS || "").split(",").map((value) => value.trim()).filter(Boolean));
  return origin && allowed.has(origin) ? {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
    Vary: "Origin"
  } : {};
}

function json(body, status, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers } });
}

function bearer(request) {
  const match = request.headers.get("Authorization")?.match(/^Bearer ([A-Za-z0-9_-]{32})$/);
  return match?.[1] || null;
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function equalHash(left, right) {
  if (!left || !right || left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

async function parseEnvelope(request, channelId) {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > MAX_BODY_BYTES) throw new Response(null, { status: 413 });
  let envelope;
  try { envelope = await request.json(); } catch { throw json({ error: "invalid_json" }, 400); }
  if (JSON.stringify(envelope).length > MAX_BODY_BYTES) throw new Response(null, { status: 413 });
  if (envelope?.schemaVersion !== 1 || envelope?.algorithm !== "AES-256-GCM" || envelope?.channelId !== channelId || !envelope.iv || !envelope.ciphertext) {
    throw json({ error: "invalid_envelope" }, 400);
  }
  return envelope;
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") return Object.keys(cors).length ? new Response(null, { status: 204, headers: cors }) : new Response(null, { status: 403 });
    if (request.headers.get("Origin") && !Object.keys(cors).length) return json({ error: "origin_not_allowed" }, 403);
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/v1\/channels\/([^/]+)$/);
    if (!match) return json({ error: "not_found" }, 404, cors);
    const channelId = decodeURIComponent(match[1]);
    if (!CHANNEL_PATTERN.test(channelId)) return json({ error: "invalid_channel" }, 400, cors);
    const key = `channel:${channelId}`;

    if (request.method === "GET") {
      const record = await env.SYNC_CHANNELS.get(key, "json");
      return record ? json(record.envelope, 200, cors) : json({ error: "not_found" }, 404, cors);
    }

    if (request.method === "PUT") {
      const token = bearer(request);
      if (!token) return json({ error: "write_token_required" }, 401, cors);
      let envelope;
      try { envelope = await parseEnvelope(request, channelId); }
      catch (error) {
        if (error instanceof Response) {
          const body = error.body ? await error.text() : "";
          return new Response(body || null, { status: error.status, headers: { ...Object.fromEntries(error.headers), ...cors } });
        }
        throw error;
      }
      const tokenHash = await sha256(token);
      const existing = await env.SYNC_CHANNELS.get(key, "json");
      if (existing && !equalHash(existing.writeTokenHash, tokenHash)) return json({ error: "forbidden" }, 403, cors);
      const ttl = Math.max(3600, Math.min(Number(env.CHANNEL_TTL_SECONDS) || DEFAULT_TTL_SECONDS, DEFAULT_TTL_SECONDS));
      await env.SYNC_CHANNELS.put(key, JSON.stringify({ writeTokenHash: existing?.writeTokenHash || tokenHash, envelope }), { expirationTtl: ttl });
      return json({ ok: true, expiresIn: ttl }, existing ? 200 : 201, cors);
    }

    if (request.method === "DELETE") {
      const token = bearer(request);
      if (!token) return json({ error: "write_token_required" }, 401, cors);
      const existing = await env.SYNC_CHANNELS.get(key, "json");
      if (!existing) return new Response(null, { status: 204, headers: cors });
      if (!equalHash(existing.writeTokenHash, await sha256(token))) return json({ error: "forbidden" }, 403, cors);
      await env.SYNC_CHANNELS.delete(key);
      return new Response(null, { status: 204, headers: cors });
    }
    return json({ error: "method_not_allowed" }, 405, { Allow: "GET, PUT, DELETE, OPTIONS", ...cors });
  }
};
