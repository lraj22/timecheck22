import { settings, updateSettings } from "./settings";
import { dom, schoolIdMappings, schools } from "./util";

const pageIdsToName = {
	"home": "Home",
	"settings": "Settings",
	"school": "School",
	"schedules": "Schedules",
	"keyboardShortcuts": "Keyboard shortcuts",
	"about": "About",
	"scheduleManagers": "For Schedule Managers",
	"dev": "Developers",
};
let currentPage = null;

export function navigateToSidebarPage (page, lackedUserInteraction) {
	if (!(page in pageIdsToName)) {
		console.error(`Invalid page '${page}' sent to navigateToSidebarPage.`);
		return;
	}
	
	// switch which one has [id] so that CSS is aware
	document.querySelector("#currentSidebarPage").id = "";
	document.querySelector(`[data-page-name="${page}"]`).id="currentSidebarPage";
	
	dom.sidebarLocation.textContent = pageIdsToName[page]; // change breadcrumbs title
	dom.sbBack.style.visibility = (page !== "home") ? "visible" : "hidden"; // change back button visibility
	currentPage = page.toString(); // change 'currentPage' (w/ duplicate variable)
	
	if (lackedUserInteraction) umami.track("sidebar-page-navigated", {
		"page": page,
	});
}

export function toggleSidebar (force) {
	let isNowOpen = dom.sidebar.classList.toggle("sidebarVisible", force);
	if (!isNowOpen) {
		dom.sidebar.querySelectorAll(".element-highlight").forEach(el => el.classList.remove("element-highlight"));
	}
	
	umami.track("sidebar-toggled", {
		"isOpenNow": isNowOpen,
	});
	
	return isNowOpen;
}

// any element that has [data-navigate-to] attr may be clicked to navigate immediately
document.querySelectorAll("[data-navigate-to]").forEach(el => {
	el.setAttribute("tabindex", "0"); // make tab-focusable
	el.addEventListener("click", function (e) {
		let page = e.target.getAttribute("data-navigate-to");
		navigateToSidebarPage(page);
		if (page === "school") {
			dom.schoolSelect.focus();
		}
	});
});

// toggle sidebar
dom.toggleSidebar.addEventListener("click", _ => {
	toggleSidebar();
	navigateToSidebarPage("home");
});

// back button
dom.sbBack.addEventListener("click", function () {
	let page = currentPage.split("/").slice(0, -1).join("/") || "home"; // go back one layer, or go home
	navigateToSidebarPage(page);
});

// close button
dom.sbClose.addEventListener("click", _ => toggleSidebar(false));

// id/name navigation
dom.sidebarLocation.addEventListener("dblclick", _ => {
	let page = window.prompt("You are navigating to a page by ID/name. Please type the page ID/name exactly.");
	if (!page) return;
	
	page = page.trim().toLowerCase();
	let foundPage = Object.entries(pageIdsToName).find(
		// if either ID or name match, go with it
		pageMapping => ((pageMapping[0].toLowerCase() === page) || (pageMapping[1].toLowerCase() === page))
	);
	if (foundPage) {
		navigateToSidebarPage(foundPage[0]);
	} else {
		alert("That page wasn't found.");
	}
});

// school page
// create school options in sidebar
schools.forEach(({ id, name, repo, category }) => {
	if (id === -1) return;
	let option = document.createElement("option");
	option.value = repo;
	option.setAttribute("data-school-id", id);
	option.textContent = name;
	let optgroupId = ({
		"high": "schoolSelectHighGroup",
		"middle": "schoolSelectMiddleGroup",
		"none": "schoolSelect",
	})[category] || "schoolSelectUncategorized";
	dom[optgroupId].appendChild(option);
	if (settings.schoolId === id.toString()) {
		option.selected = true;
	}
});
// update school setting when changed
dom.schoolSelect.addEventListener("change", function () {
	settings.schoolId = dom.schoolSelect.selectedOptions[0].getAttribute("data-school-id");
	updateSettings(true);
	
	umami.track("school-selected", {
		"name": schoolIdMappings[settings.schoolId].name,
		"schoolId": settings.schoolId,
	});
});

function removeHighlight () {
	this.classList.remove("element-highlight");
	this.removeEventListener("click", removeHighlight);
}

// enable clicking the middle status text
dom.statusMiddle.addEventListener("click", function () {
	let schoolSelected = !this.querySelector("span.linklike");
	if (schoolSelected) {
		toggleSidebar(true);
		navigateToSidebarPage("school");
		
		umami.track("school-name-clicked", {
			"alreadySelected": true,
		});
	} else {
		console.log("ONBOARDING!");
		toggleSidebar(true);
		navigateToSidebarPage("home");
		dom.schoolOption.classList.add("element-highlight");
		dom.schoolOption.addEventListener("click", removeHighlight);
		
		umami.track("school-name-clicked", {
			"alreadySelected": false,
		});
	}
});

// settings
document.querySelectorAll("[data-setting-name]").forEach(settingInput => {
	let settingName = settingInput.getAttribute("data-setting-name");
	settingInput.addEventListener("change", _ => {
		settings[settingName] = ((settingInput.type === "checkbox") ? settingInput.checked : settingInput.value);
		updateSettings();
		
		umami.track("setting-changed", {
			"setting": settingName,
			"newValue": settings[settingName],
		});
	});
});

// developer
dom.setEnv.addEventListener("click", _ => {
	let currentEnv = localStorage.getItem("env");
	let env = prompt("Current value: " + JSON.stringify(currentEnv) + "\nEnter new 'env' environment:");
	if (env === null) {
		localStorage.removeItem("env");
		alert("Successfully removed.");
	} else {
		localStorage.setItem("env", env);
		alert("Successfully set.");
	}
});
dom.enableAnalytics.addEventListener("click", _ => {
	localStorage.removeItem("umami.disabled");
	alert("Analytics enabled.");
});
dom.disableAnalytics.addEventListener("click", _ => {
	localStorage.setItem("umami.disabled", "true");
	alert("Analytics disabled.");
});

navigateToSidebarPage("home", true);
