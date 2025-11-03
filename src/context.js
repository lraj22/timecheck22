// context.js - manages operations in context.html

import "./context.css";
import "./settings";
import { fetchContext, settings } from "./settings";
import { clockdata, dom, schools } from "./util";

schools.forEach(({ id, name, repo }) => {
	if (id === -1) return; // don't include 'none' school!
	
	let option = document.createElement("option");
	option.value = repo;
	option.setAttribute("data-school-id", id);
	option.textContent = name;
	dom.schoolSelect.appendChild(option);
	if (settings.schoolId === id.toString()) {
		option.selected = true;
	}
});

dom.startBlank.addEventListener("click", _ => establishContext({}));
dom.loadText.addEventListener("click", _ => {
	let text = dom.textContext.value;
	try {
		let json = JSON.parse(text);
		establishContext(json);
	} catch (e) {
		alert("Invalid JSON\n" + e.message);
	}
});
dom.pickSchool.addEventListener("click", async _ => {
	let schoolId = dom.schoolSelect[dom.schoolSelect.selectedIndex].getAttribute("data-school-id");
	await fetchContext({
		"schoolId": schoolId,
	});
	establishContext(clockdata);
});

function establishContext (context) {
	// do something here
}
