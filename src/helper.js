// helper.js - provides helpful things to other files!

// imports
import { DateTime, Interval } from "luxon";

export const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const schools = [
	{
		"id": -1,
		"name": "None",
		"repo": "",
	},
	{
		"id": 1,
		"name": "Chino Hills High School (real school)",
		"repo": "lraj22/chhs-clockdata",
	},
	{
		"id": -2,
		"name": "Always High School (fake school that is always doing something!)",
		"repo": "lraj22/alwayshs-clockdata",
	},
	// TODO: add some more fake schools for testing purposes
];
const schoolIdMappings = Object.fromEntries(schools.map((school, index) => [school.id, index]));
console.log(schoolIdMappings);

var logIdNumber = 1;
/*
 * localStorage 'env' usually does not exist,
 * but can indicate the dev environment if set manually.
 * This is to prevent regular users from running into unexpected errors.
 */
export var ENVIRONMENT = localStorage.getItem("env");
export function log(m, override) {
	if (override || (ENVIRONMENT === "dev")) {
		dom.consoleView.textContent = "[" + (logIdNumber++) + "] " + m;
	} else {
		console.log.apply(this, arguments);
	}
}

// import all DOM elements by [id]
export var dom = {};
document.querySelectorAll("[id]").forEach(element => dom[element.id] = element);

// create school options in sidebar
schools.forEach(({ id, name, repo }) => {
	let option = document.createElement("option");
	option.value = repo;
	option.setAttribute("data-school-id", id);
	option.textContent = name;
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
	} else if (("schoolId" in settings) && (settings.schoolId in schoolIdMappings)) { // use school context url
		if (settings.schoolId.toString() === "-1") {
			clockdata = {};
			return;
		}
		targetUrl = `https://raw.githubusercontent.com/${schools[schoolIdMappings[settings.schoolId]].repo}/refs/heads/main/context.json`;
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
			console.log("current schedule", getSchedule()); // testing
			if (usingApi) {
				savedContexts[settings.schoolId] = rawContext;
				await localforage.setItem("savedContexts", savedContexts);
			}
		});
}

// generic helpers
export function luxonDate (dateObj, timezone) {
	dateObj = dateObj || new Date();
	timezone = timezone || (("metadata" in clockdata) ? clockdata.metadata.timezone : undefined);
	return DateTime.fromObject({
		"year": dateObj.getFullYear(),
		"month": dateObj.getMonth() + 1,
		"day": dateObj.getDate(),
		"hour": dateObj.getHours(),
		"minute": dateObj.getMinutes(),
		"second": dateObj.getSeconds(),
		"millisecond": dateObj.getMilliseconds(),
	}, {
		"zone": timezone,
	});
}

export function getDate () {
	// WARNING: doesn't work yet. this is supposed to get the date in the user's school's timezone, and fallback to local time if not available
	let options = {};
	if ("metadata" in clockdata) {
		options.timeZone = clockdata.metadata.timezone;
	}
	let d = new Date(new Date().toLocaleString("en-US", options));
	return d;
}
export function pad0 (string, length) {
	return string.toString().padStart(length, "0");
}

const allPartNames = ["year", "month", "day", "hour", "minute", "second", "millisecond"];

export function stringToLuxonDuration (durationString, timezone) {
	durationString = durationString || "";
	durationString = durationString.trim();
	let separated = durationString.split("--");
	let impliedEnd = false;
	
	if (separated.length === 1) {
		separated[1] = separated[0]; // if only start specified, end will be implied by how specific the start is
		impliedEnd = true;
	}
	
	// calculate the start time & specificity
	let startTimeParts = stringToLuxonTime(separated[0], undefined, true);
	let startLeastSignificant = allPartNames.filter(partName => partName in startTimeParts).slice(-1)[0];
	let startTime = DateTime.fromObject(startTimeParts, {
		"zone": timezone || (("metadata" in clockdata) ? clockdata.metadata.timezone : undefined)
	});
	
	// calculate the end time & specificity
	let endTimeParts = stringToLuxonTime(separated[1], undefined, true);
	let endLeastSignificant = allPartNames.filter(partName => partName in endTimeParts).slice(-1)[0];
	let endTime = DateTime.fromObject(endTimeParts, {
		"zone": timezone || (("metadata" in clockdata) ? clockdata.metadata.timezone : undefined)
	});
	
	// construct an interval
	return Interval.fromDateTimes(startTime.startOf(startLeastSignificant), endTime[impliedEnd ? "endOf" : "startOf"](endLeastSignificant));
}
window.d = stringToLuxonDuration; // testing

export function stringToLuxonTime (time, timezone, onlyParsedInfo) {
	// something like "2025-09-13/06:07 AM" but with any amount of information included
	time = time || "";
	time = time.trim();
	
	let separated = time.split("/").map(part => part.trim().toUpperCase());
	let dateString = null;
	let timeString = null;
	let parsedInfo = {};
	
	if (separated.length > 1) { // both date & time parts exist
		[dateString, timeString] = separated;
	} else if (time.includes("-") || /^[0-9]{4}$/.test(time)) { // only date part (includes date separator '-' or is just year 'yyyy')
		dateString = separated[0];
	} else { // must be the time part
		parsedInfo.year = undefined;
		parsedInfo.month = undefined;
		parsedInfo.day = undefined;
		timeString = separated[0];
	}
	
	// parse the date part if not already done
	if (dateString) {
		let dateParts = dateString.split("-");
		let datePartNames = ["year", "month", "day"];
		dateParts.forEach((part, index) => {
			if (index >= 3) return; // we only have 3 parts...
			parsedInfo[datePartNames[index]] = parseInt(part);
		});
	}
	
	// parse the time part if not already done
	if (timeString) {
		let timeParts = timeString.split(/[:\.]/);
		let timePartNames = ["hour", "minute", "second", "millisecond"];
		timeParts.forEach((part, index) => {
			if (index >= 4) return; // 4 parts max lol
			if (index === 0) { // hour, in case of AM/PM
				let partValue = parseInt(part);
				if (timeString.includes("M")) partValue %= 12; // AM/PM are %= 12
				if (timeString.includes("PM")) partValue += 12; // add 12 for PM
				parsedInfo[timePartNames[index]] = partValue;
			} else {
				parsedInfo[timePartNames[index]] = parseInt(part);
			}
		});
	}
	
	// get timezone
	timezone = timezone || (("metadata" in clockdata) ? clockdata.metadata.timezone : undefined);
	
	return onlyParsedInfo ? parsedInfo : DateTime.fromObject(parsedInfo, {
		"zone": timezone,
	});
}
window.p = stringToLuxonTime; // testing

export function getSchedule () {
	if (!("schedules" in clockdata)) return {};
	let schedule = {};
	let now = DateTime.local({
		"zone": (("metadata" in clockdata) ? clockdata.metadata.timezone : undefined),
	});
	let dayOfWeek = now.weekday;
	
	// TODO: full day overrides
	
	for (let rule of clockdata.schedulingRules) {
		if (rule.match === "dayOfTheWeek") {
			let ruleParts = rule.pattern.split("--").map(part => part.trim());
			if (ruleParts.length > 1) { // something like 2 -- 5 (Tuesday - Friday inclusive)
				if ((parseInt(ruleParts[0]) <= dayOfWeek) && (dayOfWeek <= parseInt(ruleParts[1]))) {
					return clockdata.schedules[rule.schedule] || {};
				}
			} else { // something like 1 (Monday)
				if (parseInt(ruleParts[0]) === dayOfWeek) {
					return clockdata.schedules[rule.schedule] || {};
				}
			}
		} else {
			// this rule doesn't follow any of the supported matching patterns
		}
	}
	return schedule;
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
