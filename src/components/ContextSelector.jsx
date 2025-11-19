import React, { useState } from "react";
import { clockdata, schoolIdMappings, schools } from "../util";
import { fetchContext, settings } from "../settings";

export default function ContextSelector ({ establishContext }) {
	let currentSchoolId = (("schoolId" in settings) && (settings.schoolId in schoolIdMappings)) ? (settings.schoolId) : "-1";
	if (currentSchoolId.toString() === "-1") currentSchoolId = schools[1].id; // schools[0] is none, schools[1] is first in list
	
	let [textContext, setTextContext] = useState("");
	let [selectedSchoolId, setSelectedSchool] = useState(currentSchoolId);

	function useTextContext () {
		let json = null;
		let success = false;
		try {
			json = JSON.parse(textContext);
			success = true;
		} catch (e) {
			alert("Invalid JSON text input.\n" + e.message);
		}
		if (success) establishContext(json);
	}
	async function fetchSchoolContext () {
		await fetchContext({
			"schoolId": selectedSchoolId,
		});
		establishContext(clockdata.clockdata);
	}
	
	return (
		<>
			<button type="button" id="startBlank" onClick={_ => establishContext({})}>Start blank</button><br /><br />
			
			<textarea name="textContext" id="textContext" placeholder="Paste text here..." value={textContext} onChange={e => setTextContext(e.target.value)}></textarea><br />
			<button type="button" id="loadText" onClick={_ => useTextContext()}>Load from text</button><br /><br />
			
			<select name="school" id="schoolSelect" defaultValue={selectedSchoolId} onChange={e => setSelectedSchool(e.target.value)}>
				{
					// programmatically add schools
					schools.map(({ id, name }) => {
						if (id === -1) return; // don't include 'none' school!
						
						return (
							<option key={id} value={id}>{name}</option>
						);
					})
				}
			</select>
			<button type="button" id="pickSchool" onClick={async _ => await fetchSchoolContext()}>Select school</button>
		</>
	);
}