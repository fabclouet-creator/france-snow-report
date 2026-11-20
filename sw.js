/* France Snow Report : service worker (installation app + secours hors-ligne) */
var CACHE = "fsr-v19";

self.addEventListener("install", function (e) {
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Reseau d'abord (meteo et webcams toujours fraiches), cache en secours */
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") { return; }
  var url = e.request.url;
  var isApi = url.indexOf("open-meteo.com") >= 0;
  var isCam = url.indexOf("/webcams/") >= 0 || url.indexOf("cam") >= 0 || url.indexOf("webcam") >= 0;
  if (isApi || isCam) {
    e.respondWith(fetch(e.request).catch(function () { return caches.match(e.request); }));
    return;
  }
  e.respondWith(
    fetch(e.request).then(function (res) {
      if (res && res.status === 200 && res.type === "basic") {
        var cp = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, cp); });
      }
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (m) {
        return m || caches.match("./index.html") || caches.match(".");
      });
    })
  );
});
