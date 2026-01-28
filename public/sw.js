// Establish a cache name
const cacheName = "TC22Cache_Jan2026_v1";
const base = "/";
const addBase = item => ((typeof item === "string") ? (base + item) : item);

const essentialCacheItems = [
	// main page
	"index.html",
	
	// js
	"main.js",
	"shared/util.js",
	"shared/underlays.js",
	"shared/migrate-v1-to-v2.js",
	
	// css
	"main.css",
	
	// assets
	"favicon.ico",
	"favicons/favicon-32.png",
	"favicons/favicon-16.png",
].map(addBase);

const optionalCacheItems = [
	// static assets like favicons and audio files
	/^\/favicons\/.+\.\w+$/,
	/^\/audio\/.+\.\w+$/,
	
	// manifest because it loads all the time but doesn't feel cache-important
	"manifest.webmanifest",
	
	// quill (only loads if user opens 'notes' widget)
	"shared/quill.js",
	"quill.css",
	"quill2.css",
	
	// experiments (only load if user uses them)
	"shared/experiments.js",
	/^\/experiments\/.+\.js$/,
	
	// extras (context editor)
	"context.html",
	"contextEditor.js",
	"context.css",
	
	// migrate file
	"migrate-v1-to-v2.html",
	
	/*
	* purposefully ignored the following files:
	* - robots.txt: only useful to agents that are online already lol
	* - sw.js: service workers have special caching rules as decided by the browser
	*/
].map(addBase);

const allCacheableItems = [...essentialCacheItems, ...optionalCacheItems];

const debugLogs = false;

function log() {
	if (!debugLogs) return;
	console.log.apply(this, arguments);
}

self.addEventListener("install", (event) => {
	log("[sw.js] Installing...");
	event.waitUntil(caches.open(cacheName).then(function (cache) {
		essentialCacheItems.forEach(item => cache.add(item));
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
	let url = new URL(event.request.url);
	let hostname = url.hostname;
	if (hostname !== self.location.hostname) return; // default behavior; applies to Google Fonts, GitHub repos, etc.
	
	let path = url.pathname;
	if (path === base) path = base + "index.html";
	
	// Check if path is possibly in the cache
	if (allCacheableItems.find(cachePath => path.match(cachePath))) {
		// strategy: stale-while-revalidate
		// Return everything from the cache, but at the same time do a network request and save the new item in the cache
		// This way, things load fast and save for later, but the application stays up to date (one load stale each time)
		
		event.respondWith(caches.open(cacheName).then(async (cache) => {
			// run the fetch in the background
			const fetchedResponse = fetch(event.request).then((networkResponse) => {
				cache.put(event.request, networkResponse.clone()).catch(_ => void 0); // ignore cache put errors, may occur if network response is invalid for caching (ex. http 206 partial response)
				return networkResponse;
			}).catch(_ => void 0); // ignore fetch errors, it's expected to fail when offline
			
			// get the cached response now
			const cachedResponse = await cache.match(event.request);
			
			// return the cached response (if valid) or the fetched response
			return cachedResponse || fetchedResponse;
		}));
	} else {
		log("[sw.js] Not on the list: " + path);
		return;
	}
});
