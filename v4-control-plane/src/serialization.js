import { createHash } from "node:crypto";
import { ControlPlaneError } from "./errors.js";

export function normalizeRepositoryPath(value) {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0")) {
    throw new ControlPlaneError("CONFIG_INVALID", "Canonical path must be a non-empty string");
  }
  const normalized = value.replaceAll("\\", "/").replace(/^\.\//, "");
  if (normalized.startsWith("/") || /^[A-Za-z]:\//.test(normalized) ||
      normalized.split("/").some((part) => part === ".." || part === "")) {
    throw new ControlPlaneError("CONFIG_INVALID", "Canonical path must be repository-relative without traversal", { path: value });
  }
  return normalized;
}

function canonicalValue(value) {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalValue).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalValue(value[key])}`).join(",")}}`;
  }
  throw new ControlPlaneError("SCHEMA_INVALID", "Canonical JSON cannot encode this value type");
}

export function canonicalJson(value) {
  return Buffer.from(canonicalValue(value), "utf8");
}

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
