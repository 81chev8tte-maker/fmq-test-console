import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const base = "/fmq-test-console/";
const dist = resolve("dist");
const mustExist = (relativePath) => {
  const path = resolve(dist, relativePath);
  if (!existsSync(path)) throw new Error(`Missing production build output: ${relativePath}`);
  return path;
};
const read = (relativePath) => readFileSync(mustExist(relativePath), "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const manifest = JSON.parse(read("manifest.webmanifest"));
assert(manifest.id === base, `manifest id must be ${base}`);
assert(manifest.scope === base, `manifest scope must be ${base}`);
assert(manifest.start_url === base, `manifest start_url must be ${base}`);
assert(manifest.display === "standalone", "manifest display must be standalone");

const requiredIcons = [
  { src: "icons/icon-192.png", sizes: "192x192", purpose: "any" },
  { src: "icons/icon-512.png", sizes: "512x512", purpose: "any" },
  { src: "icons/icon-maskable-512.png", sizes: "512x512", purpose: "maskable" },
];
for (const expected of requiredIcons) {
  const icon = manifest.icons?.find((candidate) => candidate.src === expected.src && candidate.sizes === expected.sizes);
  assert(icon, `manifest must reference ${expected.src} at ${expected.sizes}`);
  assert(String(icon.purpose ?? "").split(/\s+/).includes(expected.purpose), `${expected.src} must include purpose ${expected.purpose}`);
  mustExist(expected.src);
  const resolvedUrl = new URL(expected.src, `https://81chev8tte-maker.github.io${base}`).pathname;
  assert(resolvedUrl.startsWith(base), `${expected.src} must resolve inside ${base}`);
}

const html = read("index.html");
assert(html.includes(`${base}assets/`), "built assets must retain /fmq-test-console/assets/ base path");
assert(html.includes(`${base}manifest.webmanifest`), "index.html must reference the scoped web manifest");
assert(html.includes(`${base}registerSW.js`), "index.html must load scoped service-worker registration output");

const registration = read("registerSW.js");
const sw = read("sw.js");
assert(registration.includes(`register('${base}sw.js'`), "service worker registration URL must be /fmq-test-console/sw.js");
assert(registration.includes(`scope: '${base}'`), "service worker registration scope must be exactly /fmq-test-console/");
assert(!registration.includes("register('/sw.js'"), "root /sw.js registration is forbidden");
assert(!registration.includes("tuckers-guitar-trainer"), "registration output must not reference the FMQ production path");
assert(sw.includes("fmq-test-console"), "generated service worker must contain the explicit Test Console cache identity");
assert(!sw.includes("tuckers-guitar-trainer"), "generated service worker must not reference the FMQ production path");

const combined = `${html}\n${registration}\n${sw}\n${JSON.stringify(manifest)}`;
assert(!combined.includes("/tuckers-guitar-trainer/"), "production build must not reference /tuckers-guitar-trainer/");

console.log("Verified isolated FMQ Test Console PWA build.");
console.log(JSON.stringify({
  manifest: { id: manifest.id, scope: manifest.scope, start_url: manifest.start_url, display: manifest.display },
  serviceWorker: `${base}sw.js`,
  registrationScope: base,
  cacheIdentity: "fmq-test-console",
  icons: requiredIcons.map((icon) => `${base}${icon.src}`),
}, null, 2));
