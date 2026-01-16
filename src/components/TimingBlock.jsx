import React, { useState } from "react";
import { move } from "../util";
import { stringToLuxonDurationGeneric } from "../clockdata";

export default function TimingBlock ({ schIndex, schedules, updateSchedule, index }) {
	try {
	let schedule = schedules[schIndex];
	let timing = schedule.timings[index];
	
	let { s, e } = stringToLuxonDurationGeneric(timing.applies);
	let [start, setStart] = useState(s.toFormat("HH:mm"));
	let [end, setEnd] = useState(e.toFormat("HH:mm"));
	const contextFormat = "HH:mm";
	
	function updateTiming (key, value) {
		let updatedTimings = [...schedule.timings];
		updatedTimings[index][key] = value;
		updateSchedule("timings", updatedTimings);
	}
	
	function moveTiming (idx, shift) {
		updateSchedule("timings", move(schedule.timings, idx, shift));
	}
	
	function updateTimingISO (part, value) {
		let updatedStart = (part === "start") ? value : start;
		let updatedEnd = (part === "end") ? value : end;
		
		setStart(updatedStart);
		setEnd(updatedEnd);
		
		updateTiming("applies", updatedStart + " -- " + updatedEnd);
	}
	
	function removeTiming (idx) {
		if (confirm("Delete this timing?"))
			updateSchedule("timings", schedule.timings.filter((_, i) => i !== idx));
	}
	
	return (
		<div className="timing">
			<label><span>Period: </span><input type="text" name="timingLabel" value={timing.label} onChange={e => updateTiming("label", e.target.value)} /></label>
			<span>
				<label><span>From: </span><input type="time" name="timingAppliesStart" value={start} onChange={e => updateTimingISO("start", e.target.value)} /></label>
				<input type="checkbox" name="timingShowStart" checked={!timing.hideStart} onChange={e => updateTiming("hideStart", !e.target.checked)}/>
			</span>
			<span>
				<label><span>To: </span><input type="time" name="timingAppliesEnd" value={end} onChange={e => updateTimingISO("end", e.target.value)} /></label>
				<input type="checkbox" name="timingShowStart" checked={!timing.hideEnd} onChange={e => updateTiming("hideEnd", !e.target.checked)}/>
			</span>
			<span>
				<button type="button" onClick={_ => moveTiming(index, -1)} disabled={index === 0}>⬆</button>
				<button type="button" onClick={_ => moveTiming(index, 1)} disabled={index === (schedule.timings.length - 1)}>⬇</button>
				<button type="button" onClick={_ => removeTiming(index)} className="danger">X</button>
			</span>
		</div>
	);
	}
	catch (e) {
		console.log(e, schedules[schIndex].timings[index]);
	}
}