// util.js - contains no-dependency utility functions

import {
	DateTime,
	Interval,
} from "luxon"; // luxon is an exception because it is a globally available & reimportable library



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
export function log(m, override) {
	if (override || (ENVIRONMENT === "dev")) {
		dom.consoleView.textContent = "[" + (logIdNumber++) + "] " + m;
	} else {
		console.log.apply(this, arguments);
	}
}



// data
export var clockdata = {};
export const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const noneSchedule = {
	"id": "none",
	"label": "<None>",
	"timings": {},
};
export const schools = [
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
		"id": 2,
		"name": "Cal Aero Preserve Academy (real school)",
		"repo": "lraj23/capa-clockdata",
	},
	{
		"id": -2,
		"name": "Always High School (fake school that is always doing something!)",
		"repo": "lraj22/alwayshs-clockdata",
	},
];
export const schoolIdMappings = Object.fromEntries(schools.map((school, index) => [school.id, index]));



// clockdata & state related functions
export function setClockdata (newClockdata) { // when context is fetched, the new clockdata is applied!
	let data = cloneObj(newClockdata || {});
	clockdata = {...data};
	
	if (!("version" in clockdata)) {
		data.schedules = [];
	}
	// update the schedules
	let schedules = data.schedules;
	schedules.push(noneSchedule);
	
	if (!("scheduleSelect" in dom)) return;
	dom.scheduleSelect.innerHTML = `<option>Current schedule</option>`;
	schedules.forEach(schedule => {
		let option = document.createElement("option");
		option.textContent = schedule.label;
		option.value = schedule.id;
		dom.scheduleSelect.appendChild(option);
	});
	updateTimingsTable();
}

// retrieve state from localforage
const defaultState = {
	"lastApiRequest": 0,
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



// schedules related functions
export function updateTimingsTable () {
	if (!("scheduleSelect" in dom)) return;
	let schedule = ((dom.scheduleSelect.selectedIndex === 0) ? getSchedule() : getScheduleById(dom.scheduleSelect.value)).timings; // index 0 = current schedule
	let scheduleParts = [];
	if (!Array.isArray(schedule)) // aka, if still v1 context
		Object.entries(schedule).forEach((period) => { // [name, appliesArray]
			for (const appliesBlock of period[1]) {
				scheduleParts.push({
					"label": period[0],
					"applies": stringToLuxonDuration(appliesBlock),
				});
			}
		});
	else
		scheduleParts = schedule.map(timing => ({
			"label": timing.label,
			"applies": stringToLuxonDuration(timing.applies),
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

function getScheduleById (id) {
	return ("schedules" in clockdata) ? (clockdata.schedules.find(schedule => schedule.id === id) || noneSchedule) : noneSchedule;
}

const matchers = {
	"dayOfTheWeek": function (rule) {
		let dayOfWeek = DateTime.local({
			"zone": (("metadata" in clockdata) ? clockdata.metadata.timezone : undefined),
		}).weekday;
		let patternParts = rule.pattern.split("--").map(part => part.trim());
		if (patternParts.length > 1) { // something like 2 -- 5 (Tuesday - Friday inclusive)
			if ((parseInt(patternParts[0]) <= dayOfWeek) && (dayOfWeek <= parseInt(patternParts[1]))) {
				return {
					...getScheduleById(rule.schedule),
					"override": false,
				};
			}
		} else { // something like 1 (Monday)
			if (parseInt(patternParts[0]) === dayOfWeek) {
				return {
					...getScheduleById(rule.schedule),
					"override": false,
				};
			}
		}
	},
};

export function getSchedule () {
	if (!("schedules" in clockdata)) return {
		...noneSchedule,
		"isOverride": false,
	};
	let now = DateTime.local({
		"zone": (("metadata" in clockdata) ? clockdata.metadata.timezone : undefined),
	});
	
	for (let override of clockdata.full_day_overrides) {
		for (let applyRule of override.applies) {
			let appliesRange = stringToLuxonDuration(applyRule);
			if (appliesRange.contains(now)) {
				if (typeof override.schedule === "string") { // id provided
					return {
						...getScheduleById(override.schedule),
						"override": override,
					};
				} else { // schedule provided
					return {
						"label": override.occasion || override.name,
						...override.schedule, // if label is defined in override.schedule, it is allowed to override the default label
						"override": override,
					};
				}
			}
		}
	}
	
	for (let rule of (clockdata.scheduling_rules || clockdata.schedulingRules || [])) {
		if (!((rule.matcher || rule.match) in matchers)) continue; // is the matcher specified invalid? next!
		
		let result = matchers[rule.matcher || rule.match](rule);
		if (result) return result; // if it matches today, return it
	}
	
	return {
		...noneSchedule,
		"override": false,
	};
}



// generic, absolutely dependency-less helpers
export function pad0 (string, length) {
	return string.toString().padStart(length, "0");
}

const allPartNames = ["year", "month", "day", "hour", "minute", "second", "millisecond"];

export function stringToLuxonDuration (durationString, timezone) {
	durationString = durationString.toString() || "";
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
		return stringToLuxonDuration(applies).toLocaleString(format);
	}));
}

export function stringToLuxonTime (time, timezone, onlyParsedInfo) {
	// something like "2025-09-13/06:07:41.123 AM | e" but with any amount of information included
	time = time.toString() || "";
	
	let flags = [];
	let flagParts = time.split("|");
	time = flagParts[0];
	time = time.trim();
	if (flagParts[1]) {
		flags = flagParts[1].split(",").map(part => part.trim());
	}
	
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
			let partValue = parseInt(part);
			if (Number.isNaN(partValue)) return; // if invalid, ignore
			
			if (index >= 4) return; // 4 parts max lol
			if (index === 0) { // hour, in case of AM/PM
				if (timeString.includes("M")) partValue %= 12; // AM/PM are %= 12
				if (timeString.includes("PM")) partValue += 12; // add 12 for PM
			}
			parsedInfo[timePartNames[index]] = partValue;
		});
	}
	
	// get timezone & create object
	timezone = timezone || (("metadata" in clockdata) ? clockdata.metadata.timezone : undefined);
	let luxonTime = DateTime.fromObject(parsedInfo, {
		"zone": timezone,
	});
	
	let didAnythingChange = false;
	
	// process flags
	if (flags.includes("e") || flags.includes("end")) {
		let leastSignificant = allPartNames.filter(partName => partName in parsedInfo).slice(-1)[0]; // get least significant item
		let plusOptions = {};
		plusOptions[leastSignificant] = 1; // for example, if least significant is day, add one day
		luxonTime = luxonTime.plus(plusOptions);
		didAnythingChange = true;
	}
	
	if (didAnythingChange) {
		Object.keys(parsedInfo).forEach(part => parsedInfo[part] = luxonTime[part]); // update parts accordingly
	}
	
	return onlyParsedInfo ? parsedInfo : luxonTime;
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
// WARNING: cloneObj does not support cloning native objects like Date, Map, Set, etc. unless explicitly defined.
export function cloneObj (obj) {
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

export function addObj (original, addme) {
	var combined = cloneObj(original);
	if (typeof addme !== "object") return combined;
	for (var key in addme) {
		if (addme.hasOwnProperty(key)) {
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
