import React, { useState } from "react";
import { stringToLuxonDurationGeneric } from "../clockdata";
import { DateTime } from "luxon";
import { luxonToDatetimelocal } from "../util";
import DivisionSelector from "./DivisionSelector";

export default function TfoBlock ({ timeframeOverrides, setTimeframeOverrides, divisions, index, timezone }) {
	let thisTfo = timeframeOverrides[index];
	const contextFormat = "yyyy-MM-dd/HH:mm";
	let { s, e } = stringToLuxonDurationGeneric(thisTfo.applies[0]);
	let [start, setStart] = useState(luxonToDatetimelocal(s));
	let [end, setEnd] = useState(luxonToDatetimelocal(e));
	
	function setOccasion (occasion) {
		setTimeframeOverrides(timeframeOverrides.map((tfo, i) => ((i === index) ? {
			occasion,
			"label": tfo.label,
			"applies": tfo.applies,
		} : tfo)));
	}
	function setLabel (label) {
		setTimeframeOverrides(timeframeOverrides.map((tfo, i) => ((i === index) ? {
			"occasion": tfo.occasion,
			label,
			"applies": tfo.applies,
		} : tfo)));
	}
	
	function setStartISO (newStart) {
		setStart(newStart); // update the input, of course, and THEN do the main work
		
		let startFormatted = DateTime.fromISO(newStart, {
			"zone": timezone,
		}).toFormat(contextFormat);
		let endFormatted = DateTime.fromISO(end, {
			"zone": timezone,
		}).toFormat(contextFormat);
		
		setTimeframeOverrides(timeframeOverrides.map((tfo, i) => (i === index) ? {
			...tfo,
			"applies": [startFormatted + " -- " + endFormatted],
		} : tfo));
	}
	
	function setEndISO (newEnd) {
		setEnd(newEnd); // update the input, of course, and THEN do the main work
		
		let startFormatted = DateTime.fromISO(start, {
			"zone": timezone,
		}).toFormat(contextFormat);
		let endFormatted = DateTime.fromISO(newEnd, {
			"zone": timezone,
		}).toFormat(contextFormat);
		
		setTimeframeOverrides(timeframeOverrides.map((tfo, i) => (i === index) ? {
			...tfo,
			"applies": [startFormatted + " -- " + endFormatted],
		} : tfo));
	}
	
	function removeTfo (idx) {
		if (confirm("Are you sure you want to remove this timeframe override?"))
			setTimeframeOverrides(timeframeOverrides.filter((_, i) => i !== idx));
	}
	
	let [divisionId, setDivisionId] = useState(thisTfo._division_id);
	function proxySetDivisionId (newDivisionId) {
		thisTfo._division_id = newDivisionId;
		setDivisionId(newDivisionId);
	}
	
	return (
		<details className="announcement">
			<summary>
				<span>Occasion: </span>
				<input type="text" value={thisTfo.occasion} name="tfoOccasion" onChange={e => setOccasion(e.target.value)} /><br />
				<button type="button" onClick={_ => removeTfo(index)} className="danger">Delete TFO</button>
			</summary>
			<hr />
			
			<span>Period name: </span>
			<input type="text" value={thisTfo.label} name="tfoLabel" onChange={e => setLabel(e.target.value)} /><br />
			
			<span>Applies: </span>
			<input type="datetime-local" value={start} name="tfoStart" onChange={e => setStartISO(e.target.value)} />
			<span> to </span>
			<input type="datetime-local" value={end} name="tfoEnd" onChange={e => setEndISO(e.target.value)} /><br /><br />
			
			<DivisionSelector divisions={divisions} divisionId={thisTfo._division_id} setDivisionId={proxySetDivisionId} />
		</details>
	);
}
