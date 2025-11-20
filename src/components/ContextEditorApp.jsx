import React, { useState } from "react";
import { luxonToDatetimelocal, months } from "../util";
import ContextSelector from "./ContextSelector";
import AnnouncementBlock from "./AnnouncementBlock";
import SchedulingRuleBlock from "./SchedulingRuleBlock";
import ScheduleBlock from "./ScheduleBlock";
import FdoBlock from "./FdoBlock";
import { DateTime } from "luxon";
import { stringToLuxonDuration } from "../clockdata";
import TfoBlock from "./TfoBlock";

export default function ContextEditorApp () {
	let [version, setVersion] = useState("N");
	let [lastUpdated, setLastUpdated] = useState("YYYY-MM-DD-XX");
	let [schoolId, setSchoolId] = useState("");
	let [commonName, setCommonName] = useState("");
	let [shortName, setShortName] = useState("");
	let [timezone, setTimezone] = useState("");
	let [announcements, setAnnouncements] = useState([]);
	let [schedulingRules, setSchedulingRules] = useState([]);
	let [schedules, setSchedules] = useState([]);
	let [fullDayOverrides, setFullDayOverrides] = useState([]);
	let [timeframeOverrides, setTimeframeOverrides] = useState([]);
	let now = DateTime.now({
		"zone": timezone,
	});
	
	function clearFields () {
		// clear all fields
		setVersion("N");
		setLastUpdated("YYYY-MM-DD-XX");
		setSchoolId("");
		setCommonName("");
		setShortName("");
		setTimezone("");
		setAnnouncements([]);
		setSchedulingRules([]);
		setSchedules([]);
		setFullDayOverrides([]);
		setTimeframeOverrides([]);
	}
	
	function establishContext (context) {
		clearFields();
		
		// populate fields now
		if ("version" in context) {
			setVersion(context.version);
		}
		if ("last_updated_id" in context) {
			let lastUpdatedParts = context.last_updated_id.split("-").map(part => parseInt(part));
			setLastUpdated(months[lastUpdatedParts[1] - 1] + " " + lastUpdatedParts[2] + ", " + lastUpdatedParts[0] + ` (#${lastUpdatedParts[3]})`);
		}
		if ("metadata" in context) {
			if (("school_id" in context.metadata) || ("schoolId" in context.metadata)) {
				setSchoolId(context.metadata.school_id || context.metadata.schoolId);
			}
			if (("school_name" in context.metadata) || ("school" in context.metadata)) {
				setCommonName(context.metadata.school_name || context.metadata.school);
			}
			if (("short_name" in context.metadata) || ("shortName" in context.metadata)) {
				setShortName(context.metadata.short_name || context.metadata.shortName);
			}
			if ("timezone" in context.metadata) {
				setTimezone(context.metadata.timezone);
			}
		}
		if ("announcements" in context) {
			let newAnnouncements = [];
			context.announcements.forEach(announcement => {
				announcement.applies.forEach((appliesRange) => {
					newAnnouncements.push({
						"message": announcement.message,
						"applies": [appliesRange],
					});
					setAnnouncements(newAnnouncements);
				});
			});
		}
		if (("scheduling_rules" in context) || ("schedulingRules" in context)) {
			setSchedulingRules(context.scheduling_rules || context.schedulingRules || []);
		}
		if ("schedules" in context) {
			setSchedules(context.schedules);
		}
		if ("full_day_overrides" in context) {
			setFullDayOverrides(context.full_day_overrides);
		}
		if ("timeframe_overrides" in context) {
			setTimeframeOverrides(context.timeframe_overrides);
		}
	}
	
	function output () {
		let sortedFdos = fullDayOverrides.sort((fdo1, fdo2) => stringToLuxonDuration(fdo1.applies[0]).s - stringToLuxonDuration(fdo2.applies[0]).s);
		let sortedTfos = timeframeOverrides.sort((tfo1, tfo2) => stringToLuxonDuration(tfo1.applies[0]).s - stringToLuxonDuration(tfo2.applies[0]).s);
		setFullDayOverrides(sortedFdos);
		setTimeframeOverrides(sortedTfos);
		console.log({
			"version": version,
			"last_updated_id": lastUpdated,
			"metadata": {
				"school_id": schoolId,
				"school_name": commonName,
				"short_name": shortName,
				"timezone": timezone,
			},
			"announcements": announcements,
			"scheduling_rules": schedulingRules,
			"schedules": schedules,
			"full_day_overrides": sortedFdos,
			"timeframe_overrides": sortedTfos,
		});
	}
	
	return (
		<>
			<h1>Context Editor</h1>
			
			<p>Welcome to the context editor! This page is for School Managers. <a href="./">Click here to return to the clock.</a></p>
			<p>You can load context in various ways. Start blank, load from text, or by school.</p>
			
			<p>WARNING: this is a work-in-progress and doesn't really work.</p>
			
			<ContextSelector establishContext={establishContext} />
			
			<hr />
			
			<p className="uneditable" title="Context version number. You can't change this.">Version: {version}</p>
			<p className="uneditable" title="Context last updated date. You can't manually change this.">Last updated: <span id="lastUpdated">{lastUpdated}</span></p>
			
			<h3>Metadata</h3>
			
			<p title="ID of your school. You shouldn't change this.">School ID: <input type="number" placeholder="0" id="schoolId" value={schoolId} onChange={e => setSchoolId(e.target.value)} /><br />
			<small>If you already have a school ID, do not change it unless Lakshya tells you to.</small></p>
			
			<p title="What most people know your school by.">School common name: <input type="text" placeholder="Example High School" id="commonName" value={commonName} onChange={e => setCommonName(e.target.value)} /></p>
			<p title="Short name/initals. Not necessarily unique.">School short name/initials: <input type="text" placeholder="EHS" id="shortName" value={shortName} onChange={e => setShortName(e.target.value)} /><br />
			<small>A short name your school goes by. For example, Chino Hills High School can be called CHHS. This does not have to be unique.</small></p>
			
			<p>School's local timezone: <input type="text" placeholder="Continent/City" id="timezone" value={timezone} onChange={e => setTimezone(e.target.value)} /><br />
			<small>Timezones should look something like this: <code>America/Los_Angeles</code>. Don't know yours? Use <a href="https://zones.arilyn.cc/" target="_blank">this tool</a> to find your school's timezone, hit "Copy", and then paste that here.</small></p>
			
			<h3>Announcements</h3>
			<p>These show at the top of everyone's screen when they apply, and can't be cleared. They disappear automatically once they expire. Having more than one active at a time is kinda annoying, but you can schedule multiple here without them all appearing at once!</p>
			<div id="announcementsContainer">
				{
					announcements.map((_, i) => {
						return <AnnouncementBlock announcements={announcements} setAnnouncements={setAnnouncements} timezone={timezone} index={i} key={i} />;
					})
				}
				<button type="button" id="addAnnouncement" onClick={_ => {
					setAnnouncements([...announcements, {
						"message": "New Announcement",
						"applies": ["00:00 -- 23:59"],
					}]);
				}}>Add announcement</button>
			</div>
			
			<h3>Scheduling rules</h3>
			<p>The first scheduling rule to match will take effect, so make sure you put a rule for Thursday (<code>4</code>) before a rule for Monday - Friday (<code>1 -- 5</code>), or it will never take effect. If no rule matches, no schedule will happen (schedule ID: <code>none</code>). For example, Saturday & Sunday (<code>6 -- 7</code>) probably don't need a special schedule if you don't have school on those days, so it's fine if they don't have a rule matching them.</p>
			<div id="schedulingRulesContainer">
				{
					schedulingRules.map((_, i) => {
						return <SchedulingRuleBlock schedulingRules={schedulingRules} setSchedulingRules={setSchedulingRules} index={i} key={i} />;
					})
				}
				<button type="button" id="addSchedulingRule" onClick={_ => {
					setSchedulingRules([...schedulingRules, {
						"matcher": "dayOfTheWeek",
						"pattern": "",
						"schedule": "",
					}]);
				}}>Add rule</button>
			</div>
			
			<h3>Schedules</h3>
			<p>The order of schedules doesn't matter, but you can move them up and down to organize them how you like :) If you don't know what the checkboxes do, don't do anything to them. Leave them checked. (If unchecked, the over/left indicator will be hidden while the label continues to show.)</p>
			<div id="schedulesContainer">
				{
					schedules.map((schedule, i) => {
						if (schedule.id === "none") return; // do not show 'none' schedule, they can't edit it
						return <ScheduleBlock schedules={schedules} setSchedules={setSchedules} timezone={timezone} index={i} key={i} />;
					})
				}
				<button type="button" onClick={_ => {
					setSchedules([...schedules, {
						"id": "custom",
						"label": "Custom Schedule",
						"timings": []
					}]);
				}}>Add schedule</button>
			</div>
			
			<h3>Full day overrides</h3>
			<div id="fdoContainer">
				{
					fullDayOverrides.map((fdo, i) => {
						return <FdoBlock fullDayOverrides={fullDayOverrides} setFullDayOverrides={setFullDayOverrides} index={i} key={i} />
					})
				}
				<button type="button" onClick={_ => {
					setFullDayOverrides([...fullDayOverrides, {
						"occasion": "New FDO",
						"applies": [now.startOf("day").toFormat("yyyy-MM-dd") + " -- " + now.startOf("day").plus({ "days": 1 }).toFormat("yyyy-MM-dd")],
						"schedule": "none",
					}]);
				}}>Add full day override</button>
			</div>
			
			<h3>Timeframe overrides</h3>
			<div id="tfoContainer">
				{
					timeframeOverrides.map((tfo, i) => {
						return <TfoBlock timeframeOverrides={timeframeOverrides} setTimeframeOverrides={setTimeframeOverrides} index={i} key={i} />;
					})
				}
				<button type="button" onClick={_ => {
					setTimeframeOverrides([...timeframeOverrides, {
						"occasion": "New TFO",
						"label": "Example",
						"applies": [now.startOf("hour").toFormat("yyyy-MM-dd/HH:mm") + " -- " + now.startOf("hour").plus({ "hours": 1 }).toFormat("yyyy-MM-dd/HH:mm")],
					}]);
				}}>Add timeframe override</button>
			</div>
			
			<h3>Output</h3>
			<button type="button" onClick={output}>Output</button>
		</>
	);
}
