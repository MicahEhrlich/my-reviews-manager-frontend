import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { URL } from "node:url";

test("Vite emits a deployable Hebrew RTL SPA", async () => {
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
  assert.match(html, /<html lang="he" dir="rtl">/i);
  assert.match(html, /<title>Revu — ניהול מוניטין חכם<\/title>/);
  assert.match(html, /agency-theme/);
  assert.match(html, /<div id="root"><\/div>/);
  assert.match(html, /\/assets\/[^"']+\.js/);
  assert.doesNotMatch(html, /vinext|__next|react-server-dom/);
  await access(new URL("../dist/.openai/hosting.json", import.meta.url));
  const assets = await readdir(new URL("../dist/assets/", import.meta.url));
  assert.ok(assets.some((file) => file.endsWith(".css")));
  assert.ok(assets.some((file) => file.endsWith(".js")));
});
