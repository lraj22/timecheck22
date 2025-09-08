// helper.js - provides helpful things to other files!

export const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const schools = {
	"-1": {
		"name": "None",
		"repo": "",
	},
	"1": {
		"name": "Chino Hills High School",
		"repo": "lraj22/chhs-clockdata",
	},
};

var consoleId = 1;
/*
 * localStorage 'env' usually does not exist,
 * but can indicate the dev environment if set manually.
 * This is to prevent regular users from running into unexpected errors.
 */
export var ENVIRONMENT = localStorage.getItem("env");
export function log(m, override) {
	if (override || (ENVIRONMENT === "dev")) {
		consoleView.textContent = "[" + (consoleId++) + "] " + m;
	} else {
		console.log.apply(this, arguments);
	}
}

// import all DOM elements by [id]
export var dom = {};
document.querySelectorAll("[id]").forEach(element => dom[element.id] = element);

// create school options in sidebar
Object.entries(schools).forEach(([schoolId, info]) => {
	let option = document.createElement("option");
	option.value = info.repo;
	option.setAttribute("data-school-id", schoolId);
	option.textContent = info.name;
	dom.schoolSelect.appendChild(option);
});

// retrieve state from localforage
const defaultState = {
	"lastApiRequest": 0,
};
var state = await localforage.getItem("state");
if (!state) {
	await localforage.setItem("state", defaultState);
	state = cloneObj(defaultState);
} else {
	state = addObj(defaultState, state);
	await localforage.setItem("state", state);
}

async function updateState (updatedState) {
	if (updatedState) state = cloneObj(updatedState);
	await localforage.setItem("state", state);
}

// localforage store
const defaultSettings = {
	"schoolId": -1,
};
export var settings = await localforage.getItem("settings");
if (!settings) {
	await localforage.setItem("settings", defaultSettings);
	settings = cloneObj(defaultSettings);
} else {
	settings = addObj(defaultSettings, settings);
	await localforage.setItem("settings", settings);
}

function applySettings () {
	document.querySelector(`[data-school-id="${settings.schoolId}"]`).selected = true;
	fetchContext();
}
export async function updateSettings (updatedSettings) {
	if (updatedSettings) settings = cloneObj(updateSettings);
	await localforage.setItem("settings", settings);
	applySettings();
}

applySettings();

// fetch context
export var clockdata = {};
async function fetchContext (options) {
	let targetUrl = null;
	let usingApi = false;
	if (typeof options !== "object") options = {};
	
	// figure out which context to find
	if ("targetUrl" in options) { // options override
		targetUrl = options.targetUrl;
	} else if ((ENVIRONMENT === "dev") && (localStorage.getItem("contextUrl"))) { // dev override
		targetUrl = localStorage.getItem("contextUrl");
	} else if (("schoolId" in settings) && (settings.schoolId in schools)) { // use school context url
		if (settings.schoolId.toString() === "-1") {
			clockdata = {};
			return;
		}
		targetUrl = `https://raw.githubusercontent.com/${schools[settings.schoolId].repo}/refs/heads/main/context.json`;
		usingApi = true;
	}
	console.log("target:", targetUrl);
	console.log("current data:", clockdata);
	if (!targetUrl) return;
	
	// ensure we're not overdoing this api thing
	let savedContexts = await localforage.getItem("savedContexts"); // get cache
	if (!savedContexts) {
		await localforage.setItem("savedContexts", {});
		savedContexts = {};
	}
	if (usingApi && !options.ignoreRateLimits) {
		let lastRequest = state.lastApiRequest;
		let now = Date.now();
		if (now < (lastRequest + 10 * 60e3)) { // preferably, don't rerequest within ten minutes
			if (settings.schoolId in savedContexts) { // we don't need to rerequest! It's in the cache :D
				clockdata = savedContexts[settings.schoolId];
				console.info("Loaded context from cache: it hasn't been 10 minutes since last API request at " + new Date(lastRequest).toLocaleString(), clockdata);
				return;
			} else { // not in cache, rerequest (and then save in cache lol)
				console.info("Fetching context regardless of rate limit: it hasn't been 10 minutes since last API request at " + new Date(lastRequest).toLocaleString());
			}
		}
		state.lastApiRequest = now;
		await updateState();
	}
	
	// let's go!
	fetch(targetUrl)
		.then(res => res.json())
		.then(async function (rawContext) {
			console.log("received new context!", rawContext);
			clockdata = rawContext;
			if (usingApi) {
				savedContexts[settings.schoolId] = rawContext;
				await localforage.setItem("savedContexts", savedContexts);
			}
		});
}

// generic helpers
export function pad0 (string, length) {
	return string.toString().padStart(length, "0");
}

// Convert number of milliseconds to human-readable string
export function msToTimeDiff (ms, f) {
	var timeSeconds = (f ? f : Math.round)(ms / 1000);
	var outComponents = [];
	var forceAllNext = false;
	if (forceAllNext || (timeSeconds >= 3600)) {
		outComponents.push(Math.floor(timeSeconds / 3600).toString());
		timeSeconds %= 3600;
		forceAllNext = true;
	}
	if (forceAllNext || (timeSeconds >= 60)) {
		outComponents.push(Math.floor(timeSeconds / 60).toString());
		timeSeconds %= 60;
		forceAllNext = true;
	}
	outComponents.push(timeSeconds.toString());
	if (outComponents.length > 2) {
		outComponents[1] = outComponents[1].padStart(2, "0");
	}
	if (outComponents.length > 1) {
		let lastIndex = outComponents.length - 1;
		outComponents[lastIndex] = outComponents[lastIndex].padStart(2, "0");
		return outComponents.join(":");
	} else {
		return outComponents[0] + "s";
	}
}

// cloneObj function taken & modified from https://stackoverflow.com/a/7574273
// WARNING: cloneObj does not support cloning native objects like Date, Map, Set, etc. unless explicitly defined.
function cloneObj (obj) {
	if (obj == null || typeof (obj) != 'object') {
		return obj;
	}
	if (obj instanceof Date) {
		return obj;
	}

	var clone = new obj.constructor();
	for (var key in obj) {
		if (obj.hasOwnProperty(key)) {
			clone[key] = cloneObj(obj[key]);
		}
	}

	return clone;
}
function addObj (original, addme) {
	var combined = cloneObj(original);
	if (typeof addme !== "object") return combined;
	for (var key in addme) {
		if (addme.hasOwnProperty(key)) {
			combined[key] = addme[key];
		}
	}
	return combined;
}

// keeps track of when page is fully loaded
let loadFlags = 0;
export function loaded () {
	var threshold = 1; // waiting for 2 flags: window.onload
	if (!navigator.onLine) threshold = 1; // just wait for load
	loadFlags++;
	if (loadFlags >= threshold) {
		console.log("finished loading!");
	}
}
