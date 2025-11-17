import React from "react";
import { move } from "../util";
import TimingBlock from "./TimingBlock";

export default function ScheduleBlock ({ schedules, setSchedules, index }) {
	let schedule = schedules[index];
	
	function updateSchedule (key, value) {
		setSchedules(schedules.map((schedule, i) => {
			if (i !== index) return schedule;
			let updatedSchedule = {
				...schedule
			};
			updatedSchedule[key] = value;
			return updatedSchedule;
		}));
	}
	
	function moveSchedule (idx, shift) {
		setSchedules(move(schedules, idx, shift));
	}
	
	return (
		<div className="schedule">
			<span>Schedule ID: </span>
			<input type="text" name="id" value={schedule.id || ""} onChange={e => updateSchedule("id", e.target.value)} /><br />
			<span>Schedule label (name): </span>
			<input type="text" name="label" value={schedule.label || ""} onChange={e => updateSchedule("label", e.target.value)} /><br />
			<span>Timings:</span>
			{
				schedule.timings.map((_, i) => {
					return <TimingBlock key={i} schIndex={index} index={i} schedules={schedules} updateSchedule={updateSchedule} />;
				})
			}
			<br />
			<button type="button" onClick={_ => moveSchedule(index, -1)} disabled={index === 0}>Move up</button><span> </span>
			<button type="button" onClick={_ => moveSchedule(index, 1)} disabled={index === (schedules.length - 1)}>Move down</button>
		</div>
	);
}
