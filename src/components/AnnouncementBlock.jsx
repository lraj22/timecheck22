import React, { useState } from "react";
import { stringToLuxonDuration } from "../util";
import { DateTime } from "luxon";

export default function AnnouncementBlock ({ announcements, setAnnouncements, index, timezone }) {
	function luxonToDatetimelocal (time) {
		return time.toISO({
			"precision": "minute",
			"includeOffset": false,
		});
	}
	
	let announcement = announcements[index];
	let { s, e } = stringToLuxonDuration(announcement.applies[0]);
	let [start, setStart] = useState(luxonToDatetimelocal(s));
	let [end, setEnd] = useState(luxonToDatetimelocal(e));
	
	function setMessage (message) {
		setAnnouncements(announcements.map((announcement, i) => ((i === index) ? {
			...announcement,
			message,
		} : announcement)));
	}
	function setStartISO (newStart) {
		setStart(newStart); // update the input, of course, and THEN do the main work
		const contextFormat = "yyyy-MM-dd/HH:mm";
		
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
		const contextFormat = "yyyy-MM-dd/HH:mm";
		
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
	
	return (
		<div className="announcement">
			<span>Message: </span>
			<input type="text" value={announcement.message} onChange={e => setMessage(e.target.value)} /><br />
			
			<span>Applies: </span>
			<input type="datetime-local" value={start} onChange={e => setStartISO(e.target.value)} />
			<span> to </span>
			<input type="datetime-local" value={end} onChange={e => setEndISO(e.target.value)} />
		</div>
	);
}
