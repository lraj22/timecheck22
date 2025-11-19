import React, { useState } from "react";
import { stringToLuxonDuration } from "../clockdata";
import { DateTime } from "luxon";

export default function FdoBlock ({ fullDayOverrides, setFullDayOverrides, index, timezone }) {
	let fdo = fullDayOverrides[index];
	const contextFormat = "yyyy-MM-dd";
	let { s, e } = stringToLuxonDuration(fdo.applies[0]);
	let [start, setStart] = useState(s.toFormat(contextFormat));
	let [end, setEnd] = useState(e.toFormat(contextFormat));
	
	function setOccasion (occasion) {
		setFullDayOverrides(fullDayOverrides.map((fdo, i) => ((i === index) ? {
			occasion,
			"applies": fdo.applies,
			"schedule": fdo.schedule,
		} : fdo)));
	}
	function setSchedule (schedule) {
		setFullDayOverrides(fullDayOverrides.map((fdo, i) => ((i === index) ? {
			"occasion": fdo.occasion,
			"applies": fdo.applies,
			schedule,
		} : fdo)));
	}
	
	function setStartISO (newStart) {
		setStart(newStart); // update the input, of course, and THEN do the main work
		
		let startFormatted = DateTime.fromISO(newStart, {
			"zone": timezone,
		}).toFormat(contextFormat);
		let endFormatted = DateTime.fromISO(end, {
			"zone": timezone,
		}).toFormat(contextFormat);
		
		setFullDayOverrides(fullDayOverrides.map((fdo, i) => (i === index) ? {
			...fdo,
			"applies": [startFormatted + " -- " + endFormatted],
		} : fdo));
	}
	
	function setEndISO (newEnd) {
		setEnd(newEnd); // update the input, of course, and THEN do the main work
		
		let startFormatted = DateTime.fromISO(start, {
			"zone": timezone,
		}).toFormat(contextFormat);
		let endFormatted = DateTime.fromISO(newEnd, {
			"zone": timezone,
		}).toFormat(contextFormat);
		
		setFullDayOverrides(fullDayOverrides.map((fdo, i) => (i === index) ? {
			...fdo,
			"applies": [startFormatted + " -- " + endFormatted],
		} : fdo));
	}
	
	function removeFdo (idx) {
		if (confirm("Are you sure you want to remove this full day override?"))
			setFullDayOverrides(fullDayOverrides.filter((_, i) => i !== idx));
	}
	
	return (
		<div className="announcement">
			<span>Occasion: </span>
			<input type="text" value={fdo.occasion} onChange={e => setOccasion(e.target.value)} /><br />
			
			<span>Applies: </span>
			<input type="date" value={start} onChange={e => setStartISO(e.target.value)} />
			<span> (included) to </span>
			<input type="date" value={end} onChange={e => setEndISO(e.target.value)} />
			<span> (excluded)</span><br /><br />
			
			<span>Schedule ID: </span>
			<input type="text" value={fdo.schedule} onChange={e => setSchedule(e.target.value)} /><br />
			
			<button type="button" onClick={_ => removeFdo(index)} className="danger">Delete FDO</button>
		</div>
	);
}
