import { spawn } from "node:child_process";

// Explicit empty values prevent .env.local from attaching the preview to Blob.
const args = process.argv.includes("--build") ? ["build"] : ["dev", "--hostname", "127.0.0.1", "--port", "3100"];
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", ...args], {
  stdio: "inherit",
  env: { ...process.env, SERVITEC_LOCAL_PREVIEW: "1", BLOB_READ_WRITE_TOKEN: "", BLOB_CATALOG_BASE_URL: "", NEXT_PUBLIC_BLOB_PUBLIC_BASE_URL: "", NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3100" },
});
child.on("exit", code => process.exit(code ?? 0));
process.on("SIGINT", () => child.kill());
