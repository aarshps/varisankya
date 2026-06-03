/* App-shell service worker for Varisankya.
 *
 * Design rules (learned the hard way):
 *  - A navigation handler must NEVER resolve to `undefined` — that makes the
 *    top-level response fail ("This page couldn't load" on iOS standalone PWAs).
 *  - Don't re-cache the navigation HTML on every request: after a new deploy the
 *    cached HTML references hashed chunks that no longer exist. Serve fresh HTML
 *    from the network and keep only an install-time shell for true offline.
 *  - Only intercept what we understand (navigations + immutable static assets);
 *    let everything else (RSC payloads, Firebase, Google) pass straight through.
 */
const CACHE = "varisankya-v2";
const SHELL = ["/", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

const OFFLINE_HTML = `<!doctype html><html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Varisankya</title>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#0b0b0d;color:#f1f1f3;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center">
<div><h1 style="font-weight:800">You're offline</h1>
<p style="opacity:.7">Reconnect and reload to use Varisankya.</p>
<button onclick="location.reload()" style="margin-top:12px;padding:10px 20px;border:0;border-radius:999px;background:#f1f1f3;color:#18181b;font-weight:700">Reload</button></div>`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL))
      .catch(() => {}) // never block install on a cache miss
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Cross-origin (Firebase, Google sign-in, analytics) — never intercept.
  if (url.origin !== self.location.origin) return;

  // Navigations: network-first; always resolve to a defined Response.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match("/", { ignoreSearch: true });
        return (
          cached ||
          new Response(OFFLINE_HTML, {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          })
        );
      }),
    );
    return;
  }

  // Immutable hashed assets + icons: cache-first.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(request, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Everything else (RSC data, API, etc.): let the browser handle it.
});
