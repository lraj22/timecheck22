// context.js - manages operations in context.html

import "./context.css";
import "./settings";
import { fetchContext, settings } from "./settings";
import { clockdata, dom, months, schools, stringToLuxonDuration } from "./util";

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
	let schoolId = dom.schoolSelect.options[dom.schoolSelect.selectedIndex].getAttribute("data-school-id");
	await fetchContext({
		"schoolId": schoolId,
	});
	establishContext(clockdata);
});

function establishContext (context) {
	// clear all previous fields
	dom.lastUpdated.textContent = "YYYY-MM-DD-XX";
	dom.schoolId.value = dom.commonName.value = dom.shortName.value = dom.timezone.value = "";
	document.querySelectorAll(".announcement").forEach(announcement => announcement.remove());
	
	// populate fields now
	if ("last_updated_id" in context) {
		let lastUpdatedParts = context.last_updated_id.split("-").map(part => parseInt(part));
		dom.lastUpdated.textContent = months[lastUpdatedParts[1] - 1] + " " + lastUpdatedParts[2] + ", " + lastUpdatedParts[0] + ` (#${lastUpdatedParts[3]})`;
	}
	if ("metadata" in context) {
		if ("schoolId" in context.metadata) {
			dom.schoolId.value = context.metadata.schoolId;
		}
		if ("school" in context.metadata) {
			dom.commonName.value = context.metadata.school;
		}
		if ("shortName" in context.metadata) {
			dom.shortName.value = context.metadata.shortName;
		}
		if ("timezone" in context.metadata) {
			dom.timezone.value = context.metadata.timezone;
		}
	}
	if ("announcements" in context) {
		context.announcements.forEach(announcement => {
			announcement.applies.forEach((appliesRange) => {
				createAnnouncement({
					"message": announcement.message,
					"applies": [appliesRange],
				}, true);
			})
		});
	}
}

dom.addAnnouncement.addEventListener("click", _ => {
	createAnnouncement({
		"message": "New Announcement",
		"applies": ["00:00 -- 23:59"],
	}, true);
});

function createAnnouncement (data, addIt) {
	let announcement = document.createElement("div");
	announcement.classList.add("announcement");
	announcement.innerHTML = `<span>Message: </span><input type="text" data-message><br>Applies: <input type="datetime-local" data-start> to <input type="datetime-local" data-end>`;
	announcement.querySelector(`[data-message]`).value = data.message;
	let startEl = announcement.querySelector(`[data-start]`);
	let endEl = announcement.querySelector(`[data-end]`);
	if (Array.isArray(data.applies)) {
		// known flaw: only checks first apply item. it'd be too complicated to have multiple time periods on one announcement
		let { s, e } = stringToLuxonDuration(data.applies[0]);
		startEl.value = luxonToDatetimelocal(s);
		endEl.value = luxonToDatetimelocal(e);
	}
	
	if (addIt) {
		dom.announcementsContainer.insertBefore(announcement, dom.addAnnouncement);
	}
	
	return announcement;
}

function luxonToDatetimelocal (time) {
	return time.toISO({
		"precision": "minute",
		"includeOffset": false,
	});
}
