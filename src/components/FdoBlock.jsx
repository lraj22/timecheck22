import React, { useState } from "react";
import { stringToLuxonDuration } from "../clockdata";
import { DateTime } from "luxon";
import DivisionSelector from "./DivisionSelector";

export default function FdoBlock ({ fullDayOverrides, setFullDayOverrides, divisions, index, timezone }) {
	let thisFdo = fullDayOverrides[index];
	const contextFormat = "yyyy-MM-dd";
	let { s, e } = stringToLuxonDuration(thisFdo.applies[0]);
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
	
	let [divisionId, setDivisionId] = useState(thisFdo._division_id);
	function proxySetDivisionId (newDivisionId) {
		thisFdo._division_id = newDivisionId;
		setDivisionId(newDivisionId);
	}
	
	return (
		<details className="announcement">
			<summary>
				<span>Occasion: </span>
				<input type="text" value={thisFdo.occasion} name="fdoOccasion" onChange={e => setOccasion(e.target.value)} /><br />
				<button type="button" onClick={_ => removeFdo(index)} className="danger">Delete FDO</button>
			</summary>
			<hr />
			
			<span>Applies: </span>
			<input type="date" value={start} name="fdoStart" onChange={e => setStartISO(e.target.value)} />
			<span> (included) to </span>
			<input type="date" value={end} name="fdoEnd" onChange={e => setEndISO(e.target.value)} />
			<span> (excluded)</span><br /><br />
			
			<span>Schedule ID: </span>
			<input type="text" value={thisFdo.schedule} name="fdoSchedule" onChange={e => setSchedule(e.target.value)} /><br />
			
			<DivisionSelector divisions={divisions} divisionId={thisFdo._division_id} setDivisionId={proxySetDivisionId} />
		</details>
	);
}
