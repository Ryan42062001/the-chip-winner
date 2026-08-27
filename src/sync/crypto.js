const encoder = new TextEncoder();
const decoder = new TextDecoder();

function cryptoApi() {
  if (!globalThis.crypto?.subtle) throw new Error("Secure browser cryptography is unavailable.");
  return globalThis.crypto;
}

function base64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(value) {
  const padded = String(value).replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export async function createSyncCredentials() {
  const api = cryptoApi();
  const key = await api.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const rawKey = new Uint8Array(await api.subtle.exportKey("raw", key));
  const channelBytes = api.getRandomValues(new Uint8Array(18));
  const writeBytes = api.getRandomValues(new Uint8Array(24));
  return Object.freeze({ channelId: base64Url(channelBytes), encryptionKey: base64Url(rawKey), writeToken: base64Url(writeBytes) });
}

async function importKey(encodedKey, usage) {
  return cryptoApi().subtle.importKey("raw", fromBase64Url(encodedKey), { name: "AES-GCM" }, false, [usage]);
}

export async function encryptSyncPayload(payload, credentials, now = new Date().toISOString()) {
  if (!credentials?.channelId || !credentials?.encryptionKey) throw new Error("Sync credentials are incomplete.");
  const api = cryptoApi();
  const iv = api.getRandomValues(new Uint8Array(12));
  const key = await importKey(credentials.encryptionKey, "encrypt");
  const plaintext = encoder.encode(JSON.stringify({ schemaVersion: 1, createdAt: now, payload }));
  const encrypted = await api.subtle.encrypt({ name: "AES-GCM", iv, additionalData: encoder.encode(credentials.channelId) }, key, plaintext);
  return Object.freeze({ schemaVersion: 1, algorithm: "AES-256-GCM", channelId: credentials.channelId, iv: base64Url(iv), ciphertext: base64Url(new Uint8Array(encrypted)), createdAt: now });
}

export async function decryptSyncPayload(envelope, credentials) {
  if (envelope?.schemaVersion !== 1 || envelope?.algorithm !== "AES-256-GCM") throw new Error("Unsupported sync envelope.");
  if (envelope.channelId !== credentials?.channelId) throw new Error("Sync channel does not match.");
  try {
    const key = await importKey(credentials.encryptionKey, "decrypt");
    const decrypted = await cryptoApi().subtle.decrypt({ name: "AES-GCM", iv: fromBase64Url(envelope.iv), additionalData: encoder.encode(envelope.channelId) }, key, fromBase64Url(envelope.ciphertext));
    const decoded = JSON.parse(decoder.decode(decrypted));
    if (decoded.schemaVersion !== 1) throw new Error("Unsupported decrypted payload.");
    return decoded;
  } catch (error) {
    if (error.message === "Unsupported decrypted payload.") throw error;
    throw new Error("Sync payload could not be decrypted or was altered.");
  }
}

export function createMobileSyncFragment(credentials) {
  if (!credentials?.channelId || !credentials?.encryptionKey) throw new Error("Sync credentials are incomplete.");
  return `#mobile-sync=${encodeURIComponent(credentials.channelId)}.${encodeURIComponent(credentials.encryptionKey)}`;
}

export function parseMobileSyncFragment(fragment) {
  const match = String(fragment || "").match(/^#mobile-sync=([^.]*)\.([^.]*)$/);
  if (!match) return null;
  return Object.freeze({ channelId: decodeURIComponent(match[1]), encryptionKey: decodeURIComponent(match[2]) });
}

