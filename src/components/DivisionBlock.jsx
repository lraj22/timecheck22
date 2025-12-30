import React, { useState } from "react";

export default function DivisionBlock ({ divisions, setDivisions, index }) {
	let thisDivision = divisions[index];
	let [renameStatus, setRenameStatus] = useState(thisDivision.school_name ? "full" : thisDivision.division_short_label ? "shortLabel" : "none");
	thisDivision.renameStatus = renameStatus;
	
	function proxySetRenameStatus (value) {
		thisDivision.renameStatus = value;
		setRenameStatus(value);
	}
	
	function setDivisionId (division_id) {
		setDivisions(divisions.map((division, i) => ((i === index) ? {
			...division,
			division_id,
		} : division)));
	}
	
	function setDivisionLabel (division_label) {
		setDivisions(divisions.map((division, i) => ((i === index) ? {
			...division,
			division_label,
		} : division)));
	}
	
	function setDivisionShortLabel (division_short_label) {
		setDivisions(divisions.map((division, i) => ((i === index) ? {
			...division,
			division_short_label,
		} : division)));
	}
	
	function setSchoolName (school_name) {
		setDivisions(divisions.map((division, i) => ((i === index) ? {
			...division,
			school_name,
		} : division)));
	}
	
	function setShortName (short_name) {
		setDivisions(divisions.map((division, i) => ((i === index) ? {
			...division,
			short_name,
		} : division)));
	}
	
	function removeDivision (idx) {
		if (confirm("Are you sure you want to remove this division?"))
			setDivisions(divisions.filter((_, i) => i !== idx));
	}
	
	return (
		<details className="division">
			<summary>
				<span>Division ID: </span>
				<input type="text" value={thisDivision.division_id} placeholder="Required!" name="divisionId" onChange={e => setDivisionId(e.target.value)} />
			</summary>
			
			<p>Once you set a division ID, don't change it! All users with that division will suddenly no longer have a division.</p>
			
			<div title="Visible to users when selecting their division">
				<span>Division label: </span>
				<input type="text" value={thisDivision.division_label} placeholder="Untitled division" name="divisionId" onChange={e => setDivisionLabel(e.target.value)} /><br /><br />
			</div>
			
			<div title="Should choosing this division change the visible school name? Useful when a school is referred to by a different name by different groups. For example, the elementary kids know it as ABC Elementary, while the middle schoolers know it as ABC Junior High, despite it being the same school: ABC K-8 School of Arts">
				<span>Rename school for this division? </span>
				<select name="renameSelect" value={renameStatus} onChange={e => proxySetRenameStatus(e.target.value)}>
					<option value="none">No, keep school name</option>
					<option value="shortLabel">Just add to the end (ABC High -&gt; ABC High (9th))</option>
					<option value="full">Rename it entirely (ABC High -&gt; Whatever you want)</option>
				</select>
			</div>
			{
				(_ => {
					if (renameStatus === "shortLabel") {
						return (<div>
							<span>Short label: </span>
							<input type="text" value={thisDivision.division_short_label} name="divisionId" onChange={e => setDivisionShortLabel(e.target.value)} /><br />
							<small>The school <code>Example High</code> will become <code>Example High (9th)</code> if you enter <code>9th</code>.</small>
						</div>);
					} else if (renameStatus === "full") {
						return (<div>
							<span>School name: </span>
							<input type="text" value={thisDivision.school_name} name="divisionId" onChange={e => setSchoolName(e.target.value)} /><br />
							<small>The school <code>Example High</code> will become <code>Example Junior High</code> if you enter <code>Example Junior High</code>.</small>
						</div>);
					} else { // in case of "none" or invalid value
						return;
					}
				})()
			}
			
			<br />
			<div>
				<span>New short school name (optional, leave blank if N/A): </span>
				<input type="text" value={thisDivision.short_name} name="shortName" onChange={e => setShortName(e.target.value)} /><br /><small>If set, this overrides the "School short name/initials" in the metadata above</small><br /><br />
			</div>
			
			<button type="button" onClick={_ => removeDivision(index)} className="danger">Delete division</button>
		</details>
	);
}
