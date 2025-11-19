// clockdata.js - a framework for parsing/managing/using contexts

import { DateTime, Interval } from "luxon";

export default class Clockdata {
	// {object} matchers - object of named functions that process the matching patterns
	matchers = {};
	
	// if you want custom parsing functions, just set it here
	instantParser = null;
	intervalParser = null;
	
	/**
	 * Sets clockdata and matchers initially. Uses {}, or clockdata object when provided
	 * @param {object} [cd] - Optional clockdata to set
	 */
	constructor (cd) {
		if (typeof cd === "object") {
			this.clockdata = cloneObj(cd);
			
			// import matchers if any provided
			if ("matchers" in this.clockdata) {
				this.matchers = {
					...this.matchers, // technically, this.matchers should be {} since this is in a constructor
					...this.clockdata.matchers,
				};
			}
		} else {
			this.clockdata = {};
		}
	}
	
	/**
	 * Sets clockdata (and matchers in clockdata if any).
	 * @param {object} cd - Optional clockdata to set
	 * @returns {undefined} No return value
	 */
	setClockdata (cd) {
		if (typeof cd !== "object") {
			console.error("Invalid argument passed to Clockdata.setClockdata (not an object)", cd);
			this.clockdata = {};
			return;
		}
		
		this.clockdata = cloneObj(cd);
		
		// import matchers if any provided
		if ("matchers" in this.clockdata) {
			this.matchers = {
				...this.matchers,
				...this.clockdata.matchers,
			};
		}
	}
	
	/**
	 * Get full day override (if any) of given day or today
	 * @param {string|DateTime} [day] - Optional day to get full day overrides of (defaults to now/today)
	 * @returns {object|null} Full day override, or null if none/unavailable
	 */
	getFdoOfDay (day) {
		if (!("full_day_overrides" in this.clockdata)) return null;
		
		let now = this.getNowLuxon(day);
		
		for (let override of this.clockdata.full_day_overrides) {
			for (let applyRule of override.applies) { // each FDO can have multiple apply blocks, go through them all
				let appliesRange = (this.intervalParser || stringToLuxonDuration)(applyRule, this.getTimezone());
				if (!appliesRange.contains(now)) continue; // if this applies block doesn't work, continue to next
				
				return cloneObj(override);
			}
		}
		
		return null;
	}
	
	/**
	 * Get timezone of school (if available)
	 * @returns {string|undefined} Timezone of school (like "America/Los_Angeles"), or undefined if not available
	 */
	getTimezone () {
		let timezone = undefined;
		if (("metadata" in this.clockdata) && ("timezone" in this.clockdata.metadata)) {
			timezone = this.clockdata.metadata.timezone;
		}
		return timezone;
	}
	
	/**
	 * Get the Luxon DateTime of passed in value, or of now if not passed in
	 * @param {string|DateTime} [dt] - If passed, the time to get the Luxon DateTime of
	 * @returns {DateTime} DateTime of now, or of the time passed in
	 */
	getNowLuxon (dt) {
		if (DateTime.isDateTime(dt)) return dt;
		if (dt instanceof Date) return DateTime.fromJSDate(dt);
		
		if (typeof dt !== "undefined") {
			// if parser provided, use it!
			if (typeof this.instantParser === "function") {
				try {
					return this.instantParser(dt);
				} catch (e) {
					console.error("Provided Clockdata.instantParser function threw an error:", e, "Argument passed:", dt);
				}
			} else {
				return stringToLuxonTime(dt, this.getTimezone());
			}
		}
		
		// if none of the previous, then just return now
		return DateTime.local({
			"zone": this.getTimezone(),
		});
	}
	
	/**
	 * Check if the instant matches the matcher pattern
	 * @param {string} matcher - The matcher to use (must be defined in Clockdata.matchers first!)
	 * @param {string} pattern - The pattern the matcher will check against (if left out, will use "*")
	 * @param {string|DateTime} [dt] - The instant to check (default: now)
	 * @returns {boolean} Whether or not the instant matches
	 */
	checkMatch (matcher, pattern, dt) {
		if (!(matcher in this.matchers)) return false;
		if (typeof pattern === "undefined") pattern = "*";
		if (!DateTime.isDateTime(dt)) dt = this.getNowLuxon(dt);
		return this.matchers[matcher](dt, pattern);
	}
	
	/**
	 * Returns all scheduling rules
	 * @returns {object[]} All scheduling rules
	 */
	getSchedulingRules () {
		return this.clockdata.scheduling_rules || this.clockdata.schedulingRules || [];
	}
	
	/**
	 * Get the schedule of the day given, or of today.
	 * @param {string|DateTime} [day] - Optional day to get schedule of
	 * @returns {object} Schedule of today/that day
	 */
	getScheduleByDay (day) {
		let now = this.getNowLuxon(day);
		
		// check full day overrides
		let activeFdo = this.getFdoOfDay(now);
		if (activeFdo) {
			if (typeof activeFdo.schedule === "string") { // id provided
				return {
					...this.getScheduleById(activeFdo.schedule),
					"override": activeFdo,
				};
			} else { // schedule provided
				return {
					"label": activeFdo.occasion || activeFdo.name,
					...activeFdo.schedule, // if label is defined in override.schedule, it is allowed to override the default label
					"override": activeFdo,
				};
			}
		}
		
		// check everyday scheduling rules
		for (let rule of this.getSchedulingRules()) {
			let matches = this.checkMatch(rule.matcher, rule.pattern, now);
			if (!matches) continue; // if no match, continue forward
			
			// if match, return the schedule specified!
			return {
				...this.getScheduleById(rule.schedule),
				"override": false,
			};
		}
		
		// if nothing else, return the none schedule
		return {
			...noneSchedule,
			"override": false,
		};
	}
	
	/**
	 * Returns all timeframe overrides
	 * @returns {object[]} All timeframe overrides
	 */
	getTimeframeOverrides () {
		return (this.clockdata.timeframe_overrides || []);
	}
	
	/**
	 * Get timeframe override (if any) of given instant or right now
	 * @param {string|DateTime} [time] - Optional instant to get timeframe overrides of (defaults to now)
	 * @returns {object|null} Timeframe override, or null if none/unavailable
	 */
	getTfoByTime (time) {
		let now = this.getNowLuxon(time);
		return this.getTimeframeOverrides().find(
			tfo => tfo.applies.find(
				appliesItem => stringToLuxonDuration(appliesItem).contains(now)
			)
		) || null;
	}
	
	/**
	 * Get the timing at a given instant (default: now)
	 * @param {DateTime} [time] - Optional instant to get timing of
	 * @returns {object|null} Timing object, or null if none
	 */
	getTimingByTime (time) {
		let now = this.getNowLuxon(time);
		
		// check timeframe overrides
		let activeTfo = this.getTfoByTime(now);
		if (activeTfo) {
			return {
				"occasion": tfo.occasion || tfo.name,
				"label": tfo.label || tfo.description,
				"applies": tfo.applies,
				"isOverride": true, // add override metadata
			};
		}
		
		// check today's schedule
		let currentSchedule = this.getScheduleByDay(now);
		let rawTimings = (Array.isArray(currentSchedule.timings) ? currentSchedule.timings : Object.entries(currentSchedule.timings));
		let timings = rawTimings.map(timing => {
			if (typeof timing[0] === "string") // aka, if it used to be an object and was made into [key, value] by Object.entries
				return timing[1].map(appliesItem => ({ // same data, in different format to make it easier to parse
					"label": timing[0], // label ("label": applies[] --> ["label", applies[]])
					"applies": appliesItem, // applies block ("label": applies[] --> ["label", applies[]])
					"isOverride": false,
				}));
			else
				return [{
					...timing,
					"isOverride": false,
				}];
		}).flat(1);
		let activeTiming = timings.find(timing => stringToLuxonDuration(timing.applies).contains(now));
		if (activeTiming) return activeTiming;
		
		return null;
	}
	
	/**
	 * Returns all announcements
	 * @returns {object[]} All announcements
	 */
	getAnnouncements () {
		return (this.clockdata.announcements || []);
	}
	
	/**
	 * Get the announcements at a given instant (default: now)
	 * @param {DateTime} [time] - Optional instant to get announcements of
	 * @returns {object[]} Array of announcement objects
	 */
	getAnnouncementsByTime (time) {
		let now = this.getNowLuxon(time);
		
		return this.getAnnouncements().filter(
			announcement => announcement.applies.some(
				appliesItem => stringToLuxonDuration(appliesItem).contains(now)
			)
		);
	}
	
	/**
	 * Returns schedule in clockdata, given ID
	 * @param {string} [id] - ID of schedule to look up
	 * @returns {object} Schedule (none schedule when not found)
	 */
	getScheduleById (id) {
		if (!("schedules" in this.clockdata)) return {
			...noneSchedule,
			"isOverride": false,
		};
		
		return (this.clockdata.schedules.find(schedule => schedule.id === id) || noneSchedule);
	}
}

export const noneSchedule = {
	"id": "none",
	"label": "<None>",
	"timings": {},
};

export const allPartNames = ["year", "month", "day", "hour", "minute", "second", "millisecond"];

export function stringToLuxonTime(time, timezone, onlyParsedInfo) {
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
export function stringToLuxonDuration(durationString, timezone) {
	durationString = durationString.toString() || "";
	durationString = durationString.trim();
	let separated = durationString.split("--");
	let impliedEnd = false;

	if (separated.length === 1) {
		separated[1] = separated[0]; // if only start specified, end will be implied by how specific the start is
		impliedEnd = true;
	}

	// calculate the start time & specificity
	let startTimeParts = stringToLuxonTime(separated[0], timezone, true);
	let startLeastSignificant = allPartNames.filter(partName => partName in startTimeParts).slice(-1)[0];
	let startTime = DateTime.fromObject(startTimeParts, {
		"zone": timezone,
	});

	// calculate the end time & specificity
	let endTimeParts = stringToLuxonTime(separated[1], timezone, true);
	let endLeastSignificant = allPartNames.filter(partName => partName in endTimeParts).slice(-1)[0];
	let endTime = DateTime.fromObject(endTimeParts, {
		"zone": timezone,
	});

	// construct an interval
	if (startTime < endTime)
		return Interval.fromDateTimes(startTime.startOf(startLeastSignificant), endTime[impliedEnd ? "endOf" : "startOf"](endLeastSignificant));

	else
		return Interval.fromDateTimes(endTime.startOf(endLeastSignificant), startTime[impliedEnd ? "endOf" : "startOf"](startLeastSignificant));
}

// cloneObj function taken & modified from https://stackoverflow.com/a/7574273
// WARNING: cloneObj does not support cloning native (or foreign) classes like Date, Map, Set, etc. unless explicitly defined.
function cloneObj (obj) {
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
