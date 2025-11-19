// clockdata.js - a framework for parsing/managing/using contexts

import { DateTime } from "luxon";
import { cloneObj, noneSchedule, stringToLuxonDuration, stringToLuxonTime } from "./util";

export default class Clockdata {
	// {object} matchers - object of named functions that process the matching patterns
	matchers = {};
	
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
				let appliesRange = stringToLuxonDuration(applyRule);
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
		if (typeof dt === "string") return stringToLuxonTime(dt);
		if (typeof dt !== "undefined") console.warn("Invalid argument passed to Clockdata.getNowLuxon", dt);
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
