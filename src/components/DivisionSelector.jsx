import React from "react";

export default function DivisionSelector ({ divisions, divisionId, setDivisionId }) {
	if (divisions.length > 0) {
		return (
			<div>
				<span>Division: </span>
				<select name="divisionSelector" value={divisionId} onChange={e => setDivisionId(e.target.value)}>
					<option value="">All (not in a specific division)</option>
					{
						divisions.map(division => {
							return (
								<option value={division.division_id || "no_id_provided"} key={division._key}>{division.division_label || "Untitled division"}</option>
							);
						})
					}
				</select>
			</div>
		);
	} else {
		return;
	}
}
