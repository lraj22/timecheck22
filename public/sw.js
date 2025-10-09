// Establish a cache name
const cacheName = "TC22Cache_Oct2025_v1";
const base = "/";
const cachedItems = [
	"index.html",
	"bundle.js",
	"bundle.css",
	"favicon.ico",
	"favicons/favicon-32.png",
	"favicons/favicon-16.png",
	"sw.js",
].map(item => base + item);

var debugLogs = false;

function log() {
	if (!debugLogs) return;
	console.log.apply(this, arguments);
}

self.addEventListener("install", (event) => {
	log("[sw.js] Installing...");
	event.waitUntil(caches.open(cacheName).then(function (cache) {
		cachedItems.forEach(function (item) {
			cache.add(item);
		});
	}));
});

// remove cached items when new cache exists
self.addEventListener("activate", (e) => {
	log("[sw.js] Clearing old caches (activate event)...");
	e.waitUntil(
		caches.keys().then((keyList) => {
			log(keyList);
			return Promise.all(
				keyList.map((key) => {
					if (key === cacheName) {
						return;
					}
					return caches.delete(key);
				}),
			);
		}),
	);
});

// Network first, cache fallback strategy
self.addEventListener("fetch", (event) => {
	var parsedUrl = new URL(event.request.url).pathname;
	if (parsedUrl === base) parsedUrl = base + "index.html";
	// Check if this is one of our cached URLs
	if (cachedItems.find(path => parsedUrl.match(path))) {
		// Open the cache
		event.respondWith(caches.open(cacheName).then((cache) => {
			// Go to the network first
			return fetch(event.request.url).then((fetchedResponse) => {
				log("[sw.js] Network first! " + parsedUrl);
				cache.put(event.request, fetchedResponse.clone());
				return fetchedResponse;
			}).catch(() => {
				// If the network is unavailable, get
				log("[sw.js] From the cache: " + parsedUrl);
				return cache.match(event.request.url);
			});
		}));
	} else {
		log("[sw.js] Not on the list: " + parsedUrl);
		return;
	}
});

function shouldCache (path) {
	
}
