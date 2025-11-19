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
	
	function removeSchedule () {
		if (confirm("Are you absolutely sure you want to delete this schedule?!"))
			setSchedules(schedules.filter((_, i) => i !== index));
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
			<button type="button" onClick={_ => updateSchedule("timings", [...schedule.timings, {
				"label": "Period Label",
				"applies": "10:00 -- 11:00",
			}])}>Add timing</button>
			<br /><br />
			<button type="button" onClick={_ => moveSchedule(index, -1)} disabled={index === 0}>Move up</button>
			<button type="button" onClick={_ => moveSchedule(index, 1)} disabled={index === (schedules.length - 1)}>Move down</button>
			<button type="button" className="danger" onClick={_ => removeSchedule()}>Delete schedule</button>
		</div>
	);
}
