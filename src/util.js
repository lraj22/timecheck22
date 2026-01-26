// util.js - contains no-dependency utility functions

import {
	DateTime,
} from "luxon"; // luxon is an exception because it is a globally available & reimportable library
import Clockdata, { noneSchedule } from "./clockdata";
import localforage from "localforage";



// import all DOM elements by [id]
export var dom = {};
document.querySelectorAll("[id]").forEach(element => dom[element.id] = element);



// logging
var logIdNumber = 1;
/*
 * localStorage 'env' usually does not exist,
 * but can indicate the dev environment if set manually.
 * This is to prevent regular users from running into unexpected errors.
 */
export var ENVIRONMENT = localStorage.getItem("env");
export function logVisible () {
	dom.consoleView.textContent = "[" + (logIdNumber++) + "] " + [...arguments].join(" ");
	console.log.apply(this, arguments);
}
// analytics backup
if (!("umami" in window)) {
	window.umami = {
		"identify": _ => {},
		"track": _ => {},
	};
}



// data
export var clockdata = new Clockdata({ // initialize clockdata with all matchers
	"matchers": {
		"dayOfTheWeek": function (dt, pattern) {
			let dayOfWeek = dt.weekday;
			
			let patternParts = pattern.split("--").map(part => part.trim());
			if (patternParts.length === 1) patternParts[1] = patternParts[0]; // turn "1" (Monday) into "1 -- 1" (Monday -- Monday)
			
			if ((parseInt(patternParts[0]) <= dayOfWeek) && (dayOfWeek <= parseInt(patternParts[1]))) {
				return true;
			} else {
				return false;
			}
		},
	},
});

export const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const schools = [
	{
		"id": -1,
		"name": "None",
		"repo": "",
		"category": "none",
	},
	
	// high schools
	{
		"id": 1,
		"name": "Chino Hills High School (California)",
		"repo": "lraj22/chhs-clockdata",
		"category": "high",
	},
	{
		"id": 3,
		"name": "Ayala High School (California)",
		"repo": "ilovecats567/ayalahs-clockdata",
		"category": "high",
	},
	{
		"id": 6,
		"name": "Chino High School/BST (California)",
		"repo": "lraj22/chsbst-clockdata",
		"category": "high",
	},
	
	// middle schools
	{
		"id": 2,
		"name": "Cal Aero Preserve Academy JH (California)",
		"repo": "lraj23/capa-clockdata",
		"category": "middle",
	},
	{
		"id": 4,
		"name": "Ruth Fox Middle School (Michigan)",
		"repo": "IonixV/rfms-clockdata",
		"category": "middle",
	},
	// {
	// 	"id": 5,
	// 	"name": "Yorktown Middle School (Virginia)",
	// 	"repo": "~/yms-clockdata",
	// 	"category": "middle",
	// },
	
	// testing
	{
		"id": -2,
		"name": "Always High School (testing purposes; always doing something!)",
		"repo": "lraj22/alwayshs-clockdata",
		"category": "high",
	},
];
export const schoolIdMappings = Object.fromEntries(schools.map((school, index) => [school.id, index]));



// clockdata & state related functions
export let clockdataSetYet = false;
export function setClockdata (newClockdata) { // when context is fetched, the new clockdata is applied!
	let data = cloneObj(newClockdata || {});
	clockdata.setClockdata(data);
	clockdataSetYet = true;
	
	// show division menu if necessary
	if (("divisionSelect" in dom) && ("divisionSelectText" in dom)) {
		let divisions = clockdata.getDivisions();
		if (divisions.length === 0) dom.divisionSelectText.classList.add("hidden");
		else {
			dom.divisionSelectText.classList.remove("hidden");
			dom.divisionSelect.innerHTML = "";
			let selectedDivisionId = state.savedDivisions[settings.schoolId];
			let pickedOne = null;
			if (!selectedDivisionId) {
				// no saved one? take the first division ID we can find
				selectedDivisionId = divisions.find(division => division?.details?.division_id)?.details?.division_id;
				pickedOne = false;
			}
			clockdata.setDivisionId(selectedDivisionId);
			divisions.forEach(division => {
				let option = document.createElement("option");
				let divisionId = (division?.details?.division_id || "no_id_provided")
				option.textContent = division?.details?.division_label || "Untitled division";
				option.value = divisionId;
				option.selected = (divisionId === selectedDivisionId);
				if ((pickedOne === null) && (divisionId === selectedDivisionId)) pickedOne = true;
				dom.divisionSelect.appendChild(option);
			});
			if (!pickedOne) {
				dom.divisionSelect.classList.add("element-highlight");
				dom.divisionSelect.addEventListener("click", function setAndRemoveOnce () {
					state.savedDivisions[settings.schoolId] = selectedDivisionId;
					removeHighlight(dom.divisionSelect);
					dom.divisionSelect.removeEventListener("click", setAndRemoveOnce);
					
					umami.track("division-selected", {
						"schoolName": schools[schoolIdMappings[settings.schoolId]].name,
						"schoolId": settings.schoolId,
						"divisionLabel": clockdata.getDivisionData(selectedDivisionId)?.details?.division_label,
						"divisionId": selectedDivisionId,
					});
				});
			}
		}
	}
	
	// update the schedules
	if ("scheduleSelect" in dom) {
		let schedules = [...clockdata.getSchedules(), noneSchedule];
		dom.scheduleSelect.innerHTML = `<option>Current schedule</option>`;
		schedules.forEach(schedule => {
			let option = document.createElement("option");
			option.textContent = schedule.label;
			option.value = schedule.id;
			dom.scheduleSelect.appendChild(option);
		});
		updateTimingsTable();
	}
}

// retrieve state from localforage
const defaultState = {
	"lastApiRequest": 0,
	"widgets": {
		"timer": {
			"timeRemaining": 0,
		},
		"stopwatch": {
			"total": null,
		},
		"notes": {
			"content": null,
		}
	},
	"savedDivisions": {},
	"experiments": [],
};
export var state = await localforage.getItem("state");
if (!state) {
	await localforage.setItem("state", defaultState);
	state = cloneObj(defaultState);
} else {
	state = addObj(defaultState, state);
	await localforage.setItem("state", state);
}

export async function updateState (updatedState) {
	if (updatedState) state = cloneObj(updatedState);
	await localforage.setItem("state", state);
}
export function getExperiment (id) {
	return state.experiments.find(experiment => experiment.id === id);
}



// schedules related functions
export function updateTimingsTable () {
	if (!("scheduleSelect" in dom)) return;
	let schedule = ((dom.scheduleSelect.selectedIndex === 0) ? clockdata.getScheduleByDay() : clockdata.getScheduleById(dom.scheduleSelect.value)).timings; // select menu index 0 = current schedule
	
	let scheduleParts = [];
	if (!Array.isArray(schedule)) // aka, if still v1 context
		Object.entries(schedule).forEach((period) => { // [name, appliesArray]
			for (const appliesBlock of period[1]) {
				scheduleParts.push({
					"label": period[0],
					"applies": clockdata.stringToLuxonDuration(appliesBlock),
				});
			}
		});
	else
		scheduleParts = schedule.map(timing => ({
			"label": timing.label,
			"applies": clockdata.stringToLuxonDuration(timing.applies),
		}));
	scheduleParts = scheduleParts.sort((period1, period2) => period1.applies.start - period2.applies.start); // sort by starting time
	
	dom.scheduleTableBody.innerHTML = "";
	scheduleParts.forEach(part => {
		let tr = document.createElement("tr");
		let tdPeriod = document.createElement("td");
		tdPeriod.textContent = part.label;
		let tdWhen = document.createElement("td");
		tdWhen.textContent = part.applies.start.toFormat("h:mm a") + " to " + part.applies.end.toFormat("h:mm a");
		tr.appendChild(tdPeriod);
		tr.appendChild(tdWhen);
		dom.scheduleTableBody.appendChild(tr);
	});
}
dom?.scheduleSelect?.addEventListener("change", updateTimingsTable);



// misc functions
export function removeHighlight (el) {
	(el || this).classList.remove("element-highlight");
	(el || this).removeEventListener("click", removeHighlight);
}
export function popup (message) {
	let popupEl = document.createElement("div");
	popupEl.innerHTML = message;
	
	popupEl.style.cssText = `width: 600px; max-width: 80vw; position: fixed; top: 1rem; left: 1rem; border: 1px solid white; padding: 1rem; background-color: black; color: white`;
	
	popupEl.onclick = _ => popupEl.remove();
	
	document.body.appendChild(popupEl);
}
let hasLoaded = document.readyState === "complete";
if (!hasLoaded) window.addEventListener("load", _ => hasLoaded = true);
export function doOnLoad (fn) {
	if (hasLoaded) requestAnimationFrame(fn);
	else window.addEventListener("load", _ => requestAnimationFrame(fn));
}

function formatFontString (fontSize, fontFamily) {
	return fontSize + "px " + fontFamily;
}

export function writeText (ctx, text) {
	let fontSize = 1000;
	let fontFamily = getComputedStyle(window.tc22.pipElement || document.documentElement).fontFamily;
	let maxIterations = 1000; // prevent infinite loop
	while (maxIterations --> 0) {
		ctx.font = formatFontString(fontSize, fontFamily);
		let width = ctx.measureText(text).width;
		if (width > (0.9 * ctx.canvas.width)) fontSize *= 0.8;
		else break;
	}
	ctx.font = formatFontString(fontSize, fontFamily);
	ctx.fillText(text, ctx.canvas.width / 2, ctx.canvas.height / 2);
}



// generic, absolutely dependency-less helpers
export function pad0 (string, length) {
	return string.toString().padStart(length, "0");
}

export function luxonToDatetimelocal (time) {
	return time.toISO({
		"precision": "minute",
		"includeOffset": false,
	});
}

export function commaListify (list) {
	let lastIndex = list.length - 1;
	if (list.length > 1) list[lastIndex] = "and " + list[lastIndex];
	return ((list.length > 2) ? list.join(", ") : list.join(" "));
}

export function appliesStrarrListify (appliesBlock) {
	if (typeof appliesBlock === "string") appliesBlock = [appliesBlock];
	return commaListify(appliesBlock.map(applies => {
		let format;
		if (applies.indexOf("/") !== -1) format = DateTime.DATETIME_MED_WITH_SECONDS;
		else if (applies.includes("-") || /^[0-9]{4}$/.test(applies)) format = DateTime.DATE_MED;
		else format = DateTime.TIME_WITH_SECONDS;
		return clockdata.stringToLuxonDuration(applies).toLocaleString(format);
	}));
}

// Convert number of milliseconds to human-readable string
export function msToTimeDiff (ms, f, afterDigits) {
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
	outComponents.push(afterDigits ? timeSeconds.toFixed(afterDigits) : timeSeconds.toString());
	if (outComponents.length > 2) {
		outComponents[1] = outComponents[1].padStart(2, "0");
	}
	if (outComponents.length > 1) {
		let lastIndex = outComponents.length - 1;
		outComponents[lastIndex] = outComponents[lastIndex].padStart(afterDigits ? (3 + afterDigits) : 2, "0");
		return outComponents.join(":");
	} else {
		return outComponents[0] + (afterDigits ? "" : "s");
	}
}

export function move (original, index, diff) {
	let array = [...original];
	if (!(index.toString() in array)) return;
	let removed = array.splice(index, 1)[0];
	let newIndex = index + diff;
	if (newIndex < 0) newIndex = 0;
	if (newIndex > array.length) newIndex = array.length;
	array.splice(newIndex, 0, removed);
	return array;
}

// cloneObj function taken & modified from https://stackoverflow.com/a/7574273
// WARNING: cloneObj does not support cloning native (or foreign) classes like Date, Map, Set, etc. unless explicitly defined.
export function cloneObj (obj) {
	if ((obj == null) || (typeof obj !== "object")) {
		return obj;
	}
	if ((obj instanceof Date) || (typeof obj === "function")) {
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

export function addObj (original, addme) {
	var combined = cloneObj(original);
	if ((typeof original !== "object") || (original === null)) return cloneObj(addme);
	if ((typeof addme !== "object") || (addme === null)) return combined;
	for (var key in addme) {
		if (!addme.hasOwnProperty(key)) continue;
		if (
			(typeof combined[key] === "object") && (combined[key] !== null) &&
			(typeof addme[key] === "object") && (addme[key] !== null)
		) {
			combined[key] = addObj(combined[key], addme[key]);
		} else {
			combined[key] = addme[key];
		}
	}
	return combined;
}

export function escapeHtml (unsafe) {
	return unsafe
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}
