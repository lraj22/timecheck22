import React, { useState } from "react";
import { months } from "../util";
import ContextSelector from "./ContextSelector";
import AnnouncementBlock from "./AnnouncementBlock";
import SchedulingRuleBlock from "./SchedulingRuleBlock";

export default function ContextEditorApp () {
	let [lastUpdated, setLastUpdated] = useState("YYYY-MM-DD-XX");
	let [schoolId, setSchoolId] = useState("");
	let [commonName, setCommonName] = useState("");
	let [shortName, setShortName] = useState("");
	let [timezone, setTimezone] = useState("");
	let [announcements, setAnnouncements] = useState([]);
	let [schedulingRules, setSchedulingRules] = useState([]);
	
	function clearFields () {
		// clear all fields
		setLastUpdated("YYYY-MM-DD-XX");
		setSchoolId("");
		setCommonName("");
		setShortName("");
		setTimezone("");
		setAnnouncements([]);
		setSchedulingRules([]);
	}
	
	function establishContext (context) {
		clearFields();
		
		// populate fields now
		if ("last_updated_id" in context) {
			let lastUpdatedParts = context.last_updated_id.split("-").map(part => parseInt(part));
			setLastUpdated(months[lastUpdatedParts[1] - 1] + " " + lastUpdatedParts[2] + ", " + lastUpdatedParts[0] + ` (#${lastUpdatedParts[3]})`);
		}
		if ("metadata" in context) {
			if ("schoolId" in context.metadata) {
				setSchoolId(context.metadata.schoolId);
			}
			if ("school" in context.metadata) {
				setCommonName(context.metadata.school);
			}
			if ("shortName" in context.metadata) {
				setShortName(context.metadata.shortName);
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
		if ("schedulingRules" in context) {
			let newSchedulingRules = [];
			context.schedulingRules.forEach(schedulingRule => {
				newSchedulingRules.push(schedulingRule);
				setSchedulingRules(newSchedulingRules);
			});
		}
	}
	
	return (
		<>
			<h1>Context Editor</h1>
			
			<p>Welcome to the context editor! This page is for School Managers. <a href="./">Click here to return to the clock.</a></p>
			<p>You can load context in various ways. Start blank, load from text, or by school.</p>
			
			<p>WARNING: this is a work-in-progress and doesn't really work.</p>
			
			<ContextSelector establishContext={establishContext} />
			
			<hr />
			
			<p className="uneditable" title="Context version number. You can't change this.">Version: 1</p>
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
			<p>The first scheduling rule to match will take effect, so make sure you put a rule for Thursday (<code>4</code>) before a rule for Monday - Friday (<code>1 -- 5</code>), or it will never take effect. If no rule matches, no schedule will happen (schedule ID: <code>none</code>). For example, Saturday & Sunday (<code>6 -- 7</code>) probably don't need a special schedule if you don't have school on those days.</p>
			<div id="schedulingRulesContainer">
				{
					schedulingRules.map((_, i) => {
						return <SchedulingRuleBlock schedulingRules={schedulingRules} setSchedulingRules={setSchedulingRules} index={i} key={i} />;
					})
				}
				<button type="button" id="addSchedulingRule" onClick={_ => {
					setSchedulingRules([...schedulingRules, {
						"match": "dayOfTheWeek",
						"pattern": "",
						"schedule": "",
					}]);
				}}>Add rule</button>
			</div>
			
			<h3>Schedules</h3>
			<div id="schedulesContainer">
				<button type="button">Add schedule</button>
			</div>
			
			<h3>Full day overrides</h3>
			<div id="fdoContainer">
				<button type="button">Add full day override</button>
			</div>
			
			<h3>Timeframe overrides</h3>
			<div id="tfoContainer">
				<button type="button">Add timeframe override</button>
			</div>
		</>
	);
}
