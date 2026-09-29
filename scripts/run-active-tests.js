import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const files = readdirSync(resolve("test"))
  .filter((name) => name.endsWith(".test.js"))
  .sort()
  .map((name) => resolve("test", name));

if (!files.length) {
  console.error("No active test files found under test/.");
  process.exit(1);
}

const result = spawnSync(process.execPath, ["--test", ...files], {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
