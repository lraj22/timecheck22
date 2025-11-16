// settings.js - manages settings

import audio from "./audio";
import {
	addObj,
	clockdata,
	cloneObj,
	ENVIRONMENT,
	schoolIdMappings,
	schools,
	setClockdata,
	state,
	updateState,
} from "./util";

const defaultSettings = {
	"schoolId": -1,
	"hourFormat": "auto",
	"colonBlinkEnabled": false,
	"backgroundTheme": "dark",
	"themeUnderlay": "none",
	"foregroundTheme": "auto",
	"font": "default",
	"timerRing": "timerEndHarp",
	"timerRingVolume": "100",
};
export var settings = await localforage.getItem("settings");
if (!settings) {
	await localforage.setItem("settings", defaultSettings);
	settings = cloneObj(defaultSettings);
} else {
	settings = addObj(defaultSettings, settings);
	await localforage.setItem("settings", settings);
}

let systemTheme = null;
const darkishBgs = [
	"dark",
];
function updateDarkishLightish (newIndicator) {
	systemTheme = ((newIndicator === "light") ? "light" : "dark"); // ensure it's either dark or light, fallback to dark
	if (systemTheme === "dark") { // dark theme; darkish
		document.documentElement.classList.add("darkishBg");
		document.documentElement.classList.remove("lightishBg");
	} else { // light theme; lightish
		document.documentElement.classList.add("lightishBg");
		document.documentElement.classList.remove("darkishBg");
	}
}

let schemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
updateDarkishLightish(schemeMedia.matches ? "dark" : "light");
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", event => {
	if (settings.backgroundTheme === "system") updateDarkishLightish(event.matches ? "dark" : "light");
});

// fetch context
export async function fetchContext (options) {
	let targetUrl = null;
	let usingApi = false;
	if (typeof options !== "object") options = {};
	let schoolId = (("schoolId" in options) ? options.schoolId : settings.schoolId);
	
	//// OVERRIDING TO LOCAL FILES (testing only!)
	options.targetUrl = "./clockdata/" + schools[schoolIdMappings[schoolId]].repo.split("/")[1] + "/context.json";
	//// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
	
	// figure out which context to find
	if ("targetUrl" in options) { // options override
		targetUrl = options.targetUrl;
	} else if ((ENVIRONMENT === "dev") && (localStorage.getItem("contextUrl"))) { // dev override
		targetUrl = localStorage.getItem("contextUrl");
	} else if (
		(("schoolId" in options) && (options.schoolId in schoolIdMappings)) ||
		(("schoolId" in settings) && (settings.schoolId in schoolIdMappings))
	) { // use school context url
		if (schoolId.toString() === "-1") {
			setClockdata({
				"hasNothing": true,
			});
			return;
		}
		targetUrl = `https://raw.githubusercontent.com/${schools[schoolIdMappings[schoolId]].repo}/refs/heads/main/context.json`;
		usingApi = true;
	}
	// console.log("target:", targetUrl);
	// console.log("current data:", clockdata);
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
			if (schoolId in savedContexts) { // we don't need to rerequest! It's in the cache :D
				setClockdata(savedContexts[schoolId]);
				console.info("Loaded context from cache: it hasn't been 10 minutes since last API request at " + new Date(lastRequest).toLocaleString(), clockdata);
				return;
			} else { // not in cache, rerequest (and then save in cache lol)
				console.info("Fetching context regardless of rate limit (not in cache): it hasn't been 10 minutes since last API request at " + new Date(lastRequest).toLocaleString());
			}
		}
		state.lastApiRequest = now;
		await updateState();
	}
	
	// let's go!
	await fetch(targetUrl)
		.then(res => res.json())
		.then(async function (rawContext) {
			console.log("received new context!", rawContext);
			setClockdata(rawContext);
			if (usingApi) {
				savedContexts[schoolId] = rawContext;
				await localforage.setItem("savedContexts", savedContexts);
			}
		});
}

function applySettings (fetchAfterwards) {
	// apply setting states
	document.querySelectorAll("[data-setting-name]").forEach(settingInput => {
		let settingName = settingInput.getAttribute("data-setting-name");
		if (settingInput.type === "checkbox") {
			settingInput.checked = settings[settingName];
		} else {
			settingInput.value = settings[settingName];
		}
	});
	
	Object.entries(settings).forEach(([setting, value]) => {
		document.documentElement.setAttribute("data-setting-" + setting, value);
	});
	
	if (settings.backgroundTheme === "system") {
		updateDarkishLightish(systemTheme);
	} else {
		updateDarkishLightish(darkishBgs.includes(settings.backgroundTheme) ? "dark" : "light");
	}
	
	if ("timerRing" in settings) {
		if ((audio.currentlyPlaying.includes("timerRing")) && (audio.types.timerRing !== settings.timerRing)) {
			audio.switchTo("timerRing", settings.timerRing);
		}
		audio.types.timerRing = settings.timerRing;
	}
	
	if ("timerRingVolume" in settings) {
		audio.setVolume("timerRing", parseInt(settings.timerRingVolume) / 100);
	}
	
	if (fetchAfterwards) fetchContext();
}
export async function updateSettings (fetchAfterwards, updatedSettings) {
	if (updatedSettings) settings = cloneObj(updateSettings);
	await localforage.setItem("settings", settings);
	applySettings(fetchAfterwards);
}

applySettings(true); // true = fetch context
