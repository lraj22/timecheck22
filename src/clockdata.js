// clockdata.js - a framework for parsing/managing/using contexts

import { DateTime, Interval } from "luxon";

export default class Clockdata {
	/**
	 * @type {object} named functions that process the matching patterns
	 */
	matchers = {};
	
	/**
	 * @type {string|null} current division, if any
	 */
	divisionId = null;
	
	// if you want custom parsing functions, just set it here
	instantParser = null;
	intervalParser = null;
	
	/**
	 * Sets clockdata and matchers initially. Uses {}, or clockdata object when provided
	 * @param {object} [cd] - Optional clockdata to set
	 * @returns {void}
	 */
	constructor (cd) {
		this.stringToLuxonTime = this.stringToLuxonTime.bind(this);
		this.stringToLuxonDuration = this.stringToLuxonDuration.bind(this);
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
	 * @returns {void}
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
	 * Sets the division ID used by the instance
	 * @param {string|null} divId - division ID
	 * @returns {void}
	 */
	setDivisionId (divId) {
		this.divisionId = divId;
	}
	
	/**
	 * Gets the current division data, optionally by ID
	 * @param {string|null} [divId] - the division ID to get (defaults to current)
	 * @returns {object} division data if found, otherwise undefined
	 */
	getDivisionData (divId) {
		let divisionToFind = null;
		if (divId || (divId === null)) divisionToFind = divId;
		else if (this.divisionId) divisionToFind = this.divisionId;
		
		return (this.getDivisions().find(division => {
			if ((typeof division === "object") && ("details" in division) && ("division_id" in division.details)) {
				return division.details.division_id === divisionToFind;
			}
		}) || {});
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
				appliesItem => this.stringToLuxonDuration(appliesItem).contains(now)
			)
		);
	}
	
	/**
	 * Get the schedule of the day given, or of today.
	 * @param {string|DateTime} [day] - Optional day to get schedule of
	 * @returns {object} Schedule of today/that day
	 */
	getScheduleByDay (day) {
		let now = this.getNowLuxon(day);
		
		// check full day overrides
		let activeFdo = this.getFdoByDay(now);
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
	 * Get full day override (if any) of given day or today
	 * @param {string|DateTime} [day] - Optional day to get full day overrides of (defaults to now/today)
	 * @returns {object|null} Full day override, or null if none/unavailable
	 */
	getFdoByDay (day) {
		let now = this.getNowLuxon(day);
		
		for (let override of this.getFullDayOverrides()) {
			for (let applyRule of override.applies) { // each FDO can have multiple apply blocks, go through them all
				let appliesRange = (this.intervalParser || this.stringToLuxonDuration)(applyRule);
				if (!appliesRange.contains(now)) continue; // if this applies block doesn't work, continue to next
				
				return cloneObj(override);
			}
		}
		
		return null;
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
				appliesItem => this.stringToLuxonDuration(appliesItem).contains(now)
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
		let activeTiming = timings.find(timing => this.stringToLuxonDuration(timing.applies).contains(now));
		if (activeTiming) return activeTiming;
		
		return null;
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
				return this.stringToLuxonTime(dt);
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
	 * Get ID of school
	 * @returns {number|undefined} ID of school, or undefined if not available
	 */
	getSchoolId () {
		// school ID can't be overridden by division
		if (typeof this.clockdata.metadata !== "object") return undefined;
		return (this.clockdata.metadata.school_id || undefined);
	}
	
	/**
	 * Get school name
	 * @returns {string|undefined} School name, or undefined if not available
	 */
	getSchoolName () {
		let division = this.getDivisionData();
		let divisionSchoolName = (typeof division.metadata === "object") ? division.metadata.school_name : undefined;
		let divisionShortLabel = (typeof division.metadata === "object") ? division.details.division_short_label : undefined;
		let globalSchoolName = (typeof this.clockdata.metadata === "object") ? this.clockdata.metadata.school_name : undefined;
		if (divisionShortLabel) globalSchoolName = globalSchoolName + ` (${divisionShortLabel})`;
		return (divisionSchoolName || globalSchoolName || undefined);
	}
	
	/**
	 * Get short school name
	 * @returns {string|undefined} School name, or undefined if not available
	 */
	getSchoolShortName () {
		let division = this.getDivisionData();
		let divisionSchoolShortName = (typeof division.metadata === "object") ? division.metadata.short_name : undefined;
		let globalSchoolShortName = (typeof this.clockdata.metadata === "object") ? this.clockdata.metadata.short_name : undefined;
		return (divisionSchoolShortName || globalSchoolShortName || undefined);
	}
	
	/**
	 * Get timezone of school (if available)
	 * @returns {string|undefined} Timezone of school (like "America/Los_Angeles"), or undefined if not available
	 */
	getTimezone () {
		let timezone = undefined;
		// timezone can't be overridden by division
		if (("metadata" in this.clockdata) && ("timezone" in this.clockdata.metadata)) {
			timezone = this.clockdata.metadata.timezone;
		}
		return timezone;
	}
	
	/**
	 * Returns all divisions data
	 * @returns {object[]} All divisions data
	 */
	getDivisions () {
		return (this.clockdata.divisions || []);
	}
	
	/**
	 * Returns all announcements
	 * @returns {object[]} All announcements
	 */
	getAnnouncements () {
		let divisionAnnouncements = (this.getDivisionData().announcements || []);
		let globalAnnouncements = (this.clockdata.announcements || []);
		return [...divisionAnnouncements, ...globalAnnouncements];
	}
	
	/**
	 * Returns all scheduling rules
	 * @returns {object[]} All scheduling rules
	 */
	getSchedulingRules () {
		let divisionSchedulingRules = (this.getDivisionData().scheduling_rules || []);
		let globalSchedulingRules = (this.clockdata.scheduling_rules || this.clockdata.schedulingRules || []);
		return [...divisionSchedulingRules, ...globalSchedulingRules];
	}
	
	/**
	 * Returns all schedules
	 * @returns {object[]} All schedules
	 */
	getSchedules () {
		let divisionSchedules = (this.getDivisionData().schedules || []);
		let globalSchedules = (this.clockdata.schedules || []);
		return [...divisionSchedules, ...globalSchedules];
	}
	
	/**
	 * Returns all full day overrides
	 * @returns {object[]} All full day overrides
	 */
	getFullDayOverrides () {
		let divisionFullDayOverrides = (this.getDivisionData().full_day_overrides || []);
		let globalFullDayOverrides = (this.clockdata.full_day_overrides || []);
		return [...divisionFullDayOverrides, ...globalFullDayOverrides];
	}
	
	/**
	 * Returns all timeframe overrides
	 * @returns {object[]} All timeframe overrides
	 */
	getTimeframeOverrides () {
		let divisionTimeframeOverrides = (this.getDivisionData().timeframe_overrides || []);
		let globalTimeframeOverrides = (this.clockdata.timeframe_overrides || []);
		return [...divisionTimeframeOverrides, ...globalTimeframeOverrides];
	}
	
	/**
	 * Returns schedule in clockdata, given ID
	 * @param {string} [id] - ID of schedule to look up
	 * @returns {object} Schedule (none schedule when not found)
	 */
	getScheduleById (id) {
		return (this.getSchedules().find(schedule => schedule.id === id) || {
			...noneSchedule,
			"isOverride": false,
		});
	}
	
	/**
	 * stringToLuxonTimeGeneric wrapper that automatically fills timezone.
	 * @param {string} time - time, something like "2025-09-13/06:07:41.123 AM | e" but with any amount of information included
	 * @param {string} timezone - timezone parseable by Luxon
	 * @param {boolean} onlyParsedInfo - dictates what information is returned
	 * @returns {object | DateTime} If onlyParsedInfo is truthy, this function returns an object with the parsed information. Otherwise, it returns the DateTime object associated with the given time and timezone.
	 */
	stringToLuxonTime (time, timezone, onlyParsedInfo) {
		return stringToLuxonTimeGeneric(time, timezone || this.getTimezone(), onlyParsedInfo);
	}
	
	/**
	 * stringToLuxonDurationGeneric wrapper that automatically fills timezone.
	 * @param {string} durationString - given duration (one parseable time, or two parseable times with "--" in between)
	 * @param {string} timezone - timezone parseable by Luxon
	 * @returns {Interval} Returns the interval associated with the given duration string.
	 */
	stringToLuxonDuration (durationString, timezone) {
		if (!this) console.trace();
		return stringToLuxonDurationGeneric(durationString, timezone || this.getTimezone());
	}
}

export const noneSchedule = {
	"id": "none",
	"label": "<None>",
	"timings": {},
};

export const allPartNames = ["year", "month", "day", "hour", "minute", "second", "millisecond"];

export function stringToLuxonTimeGeneric(time, timezone, onlyParsedInfo) {
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
export function stringToLuxonDurationGeneric(durationString, timezone) {
	durationString = (durationString || "").toString() || "";
	durationString = durationString.trim();
	let separated = durationString.split("--");
	let impliedEnd = false;

	if (separated.length === 1) {
		separated[1] = separated[0]; // if only start specified, end will be implied by how specific the start is
		impliedEnd = true;
	}

	// calculate the start time & specificity
	let startTimeParts = stringToLuxonTimeGeneric(separated[0], timezone, true);
	let startLeastSignificant = allPartNames.filter(partName => partName in startTimeParts).slice(-1)[0];
	let startTime = DateTime.fromObject(startTimeParts, {
		"zone": timezone,
	});

	// calculate the end time & specificity
	let endTimeParts = stringToLuxonTimeGeneric(separated[1], timezone, true);
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
