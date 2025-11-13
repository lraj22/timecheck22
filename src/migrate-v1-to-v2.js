// migrate-v1-to-v2.js - script that converts context.json version 1 to version 2

import "./context.css";
import "./settings";
import { cloneObj, dom, pad0 } from "./util";

// the function that actually does the magic!
function transform_v1_to_v2 (v1Context) {
	let v2Context = {};
	
	// update version
	v2Context.version = 2;
	
	// update last_updated_id
	let now = new Date();
	let prevDate = (v1Context.last_updated_id || "0000-00-00-00").slice(0, 10); // the date portion (2025-06-07)
	let newDate = "" + now.getFullYear() + "-" + pad0(now.getMonth(), 2) + "-" + pad0(now.getDate(), 2);
	if (newDate !== prevDate) {
		v2Context.last_updated_id = newDate + "-01"; // first update of the day
	} else {
		let oldUpdateNumber = parseInt(v1Context.last_updated_id.split("-").slice(-1)[0]); // last part (update number)
		let newUpdateNumber = (oldUpdateNumber + 1).toString();
		if (newUpdateNumber.length % 2 === 1) newUpdateNumber = "0" + newUpdateNumber; // 2 --> 02, 99 -> 99, 123 --> 0123
		v2Context.last_updated_id = newDate + "-" + newUpdateNumber;
	}
	
	// update metadata key names
	const metadataDefaults = {
		"school_id": 0,
		"school_name": "Example High School",
		"short_name": "EHS",
		"timezone": "America/Los_Angeles",
	};
	if ("metadata" in v1Context)
		v2Context.metadata = {
			"school_id": v1Context.metadata.schoolId || metadataDefaults.school_id,
			"school_name": v1Context.metadata.school || metadataDefaults.school_name,
			"short_name": v1Context.metadata.shortName || metadataDefaults.short_name,
			"timezone": v1Context.metadata.timezone || metadataDefaults.timezone,
		};
	else
		v2Context.metadata = {
			...metadataDefaults,
		};
	
	// copy announcements as-is
	v2Context.announcements = cloneObj(v1Context.announcements || []);
	
	// rename schedulingRules to scheduling_rules and change key match -> matcher
	v2Context.scheduling_rules = (v1Context.schedulingRules || v1Context.scheduling_rules || []).map(rule => ({
		"matcher": rule.match || rule.matcher || "",
		"pattern": rule.pattern || "",
		"schedule": rule.schedule || "",
	}));
	
	// reform schedules.timings to array, with each period as an object
	v2Context.schedules = (v1Context.schedules || []).map(schedule => {
		let timings;
		if (Array.isArray(schedule.timings))
			timings = cloneObj(schedule.timings);
		else
			timings = Object.entries(schedule.timings).map(([label, applies]) => {
				if (!Array.isArray(applies)) applies = [applies]; // in case it's already just a string for some reason
				return applies.map(applyBlock => ({
					"label": label || "",
					"applies": applyBlock || "",
					// optional new fields: hideStart, hideEnd have no representation in v1, so cannot possibly be automatically converted
				}));
			}).flat(1); // applies[] field becomes applies (basically, array to string) so each timing object now returns an array of timings, which are then flat(1) into a single list of timings
		
		return {
			"id": schedule.id || "",
			"label": schedule.label || "",
			"timings": timings,
		};
	});
	
	// rename fdo.name to fdo.occasion
	v2Context.full_day_overrides = (v1Context.full_day_overrides || []).map(fdo => ({
		"occasion": fdo.name || fdo.occasion || "",
		"applies": fdo.applies || [],
		"schedule": fdo.schedule || "",
	}));
	
	// rename tfo.name to tfo.occasion, and tfo.description to tfo.label, and reorder
	v2Context.timeframe_overrides = (v1Context.timeframe_overrides || []).map(tfo => ({
		"occasion": tfo.name || tfo.occasion || "",
		"label": tfo.description || tfo.label || "",
		"applies": tfo.applies || [],
	}));
	
	return v2Context;
}

// generic onclick transformer function
dom.convert.addEventListener("click", _ => {
	let v1Context = {};
	let success = false;
	try {
		v1Context = JSON.parse(dom.v1Input.value);
		success = true;
	} catch (e) {
		dom.v2Output.value = "There was an error! Most likely, you pasted your context.json incorrectly into the input box, or maybe you didn't paste it all. Try deleting everything and pasting again, being sure NOT to add any extra characters. Here's the exact error message for reference:\n\n" + e;
		console.error(e);
		throw e;
	}
	if (!success) return;
	
	let v2Context = {};
	success = false;
	try {
		v2Context = transform_v1_to_v2(v1Context);
		success = true;
	} catch (e) {
		dom.v2Output.value = "There was an error when trying to convert the context. This is probably my fault, so just contact me (Lakshya) and show me the error. Here it is for reference:\n\n" + e;
		console.error(e);
		throw e;
	}
	if (!success) return;
	
	dom.v2Output.value = JSON.stringify(v2Context, null, "\t") + "\n";
});
