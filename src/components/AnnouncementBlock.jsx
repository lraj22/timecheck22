import React, { useState } from "react";
import { luxonToDatetimelocal } from "../util";
import { stringToLuxonDuration } from "../clockdata";
import { DateTime } from "luxon";
import DivisionSelector from "./DivisionSelector";

export default function AnnouncementBlock ({ announcements, setAnnouncements, index, divisions, timezone }) {
	let thisAnnouncement = announcements[index];
	let { s, e } = stringToLuxonDuration(thisAnnouncement.applies[0]);
	let [start, setStart] = useState(luxonToDatetimelocal(s));
	let [end, setEnd] = useState(luxonToDatetimelocal(e));
	const contextFormat = "yyyy-MM-dd/HH:mm";
	
	function setMessage (message) {
		setAnnouncements(announcements.map((announcement, i) => ((i === index) ? {
			...announcement,
			message,
		} : announcement)));
	}
	function setStartISO (newStart) {
		setStart(newStart); // update the input, of course, and THEN do the main work
		
		let startFormatted = DateTime.fromISO(newStart, {
			"zone": timezone,
		}).toFormat(contextFormat);
		let endFormatted = DateTime.fromISO(end, {
			"zone": timezone,
		}).toFormat(contextFormat);
		
		setAnnouncements(announcements.map((announcement, i) => (i === index) ? {
			...announcement,
			"applies": [startFormatted + " -- " + endFormatted],
		} : announcement));
	}
	
	function setEndISO (newEnd) {
		setEnd(newEnd); // update the input, of course, and THEN do the main work
		
		let startFormatted = DateTime.fromISO(start, {
			"zone": timezone,
		}).toFormat(contextFormat);
		let endFormatted = DateTime.fromISO(newEnd, {
			"zone": timezone,
		}).toFormat(contextFormat);
		
		setAnnouncements(announcements.map((announcement, i) => (i === index) ? {
			...announcement,
			"applies": [startFormatted + " -- " + endFormatted],
		} : announcement));
	}
	
	let [divisionId, setDivisionId] = useState(thisAnnouncement._division_id);
	function proxySetDivisionId (newDivisionId) {
		thisAnnouncement._division_id = newDivisionId;
		setDivisionId(newDivisionId);
	}
	
	function removeAnnouncement (idx) {
		if (confirm("Are you sure you want to remove this announcement?"))
			setAnnouncements(announcements.filter((_, i) => i !== idx));
	}
	
	return (
		<div className="announcement">
			<span>Message: </span>
			<input type="text" value={thisAnnouncement.message} name="announcementMessage" onChange={e => setMessage(e.target.value)} /><br />
			
			<span>Applies: </span>
			<input type="datetime-local" value={start} name="announcementStart" onChange={e => setStartISO(e.target.value)} />
			<span> to </span>
			<input type="datetime-local" value={end} name="announcementEnd" onChange={e => setEndISO(e.target.value)} /><br /><br />
			
			<DivisionSelector divisions={divisions} divisionId={thisAnnouncement._division_id} setDivisionId={proxySetDivisionId} /><br />
			
			<button type="button" onClick={_ => removeAnnouncement(index)} className="danger">Delete announcement</button>
		</div>
	);
}
