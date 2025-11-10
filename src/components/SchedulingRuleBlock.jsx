import React from "react";

export default function SchedulingRuleBlock ({ schedulingRules, setSchedulingRules, index, timezone }) {
	const placeholders = {
		"dayOfTheWeek": "1 (Monday) -- 5 (Friday)",
	};
	let schedulingRule = schedulingRules[index];
	
	function updateSchedulingRule (key, value) {
		setSchedulingRules(schedulingRules.map((schedulingRule, i) => {
			if (i !== index) return schedulingRule;
			let updatedSchedulingRule = {
				...schedulingRule
			};
			updatedSchedulingRule[key] = value;
			return updatedSchedulingRule;
		}));
	}
	
	return (
		<div className="schedulingRule">
			<span>Matches: </span>
			<select name="match" defaultValue={schedulingRule.match || "dayOfTheWeek"} onChange={e => updateSchedulingRule("match", e.target.value)}>
				<option value="dayOfTheWeek">Day of the week</option>
			</select><br />
			<span>Match pattern: </span>
			<input type="text" name="pattern" placeholder={placeholders[schedulingRule.match]} value={schedulingRule.pattern || ""} onChange={e => updateSchedulingRule("pattern", e.target.value)} /><br />
			<span>Schedule ID: </span>
			<input type="text" name="schedule" placeholder="Enter a valid schedule ID" value={schedulingRule.schedule || ""} onChange={e => updateSchedulingRule("schedule", e.target.value)} /><br /><br />
			<button type="button" onClick={_ => alert("work in progress")} disabled={index === 0}>Move up</button><span> </span>
			<button type="button" onClick={_ => alert("work in progress")} disabled={index === (schedulingRules.length - 1)}>Move down</button>
		</div>
	)
}
