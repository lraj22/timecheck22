import { schools } from "./util";

export default function (dom, settings, updateSettings) {
	const pageIdsToName = {
		"home": "Home",
		"settings": "Settings",
		"school": "School",
		"schedules": "Schedules",
		"about": "About",
		"scheduleManagers": "For Schedule Managers",
		"developers": "Developers",
	};
	let currentPage = null;

	function navigateToSidebarPage (page) {
		if (!(page in pageIdsToName)) {
			console.error(`Invalid page '${page}' sent to navigateToSidebarPage.`);
			return;
		}
		
		// switch which one has [id] so that CSS is aware
		document.querySelector("#currentSidebarPage").id = "";
		document.querySelector(`[data-page-name="${page}"]`).id="currentSidebarPage";
		
		dom.sidebarLocation.textContent = pageIdsToName[page]; // change breadcrumbs title
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
		dom.sbBack.style.visibility = (page !== "home") ? "visible" : "hidden"; // change back button visibility
		currentPage = page.toString(); // change 'currentPage' (w/ duplicate variable)
	}

	function toggleSidebar (force) {
		let isNowOpen = dom.sidebar.classList.toggle("sidebarVisible", force);
		dom.toggleSidebar.setAttribute("data-icon", isNowOpen ? "left_panel_close" : "left_panel_open")
	}

	// any element that has [data-navigate-to] attr may be clicked to navigate immediately
	document.querySelectorAll("[data-navigate-to]").forEach(el => {
		el.setAttribute("tabindex", "0"); // make tab-focusable
		el.addEventListener("click", function (e) {
			navigateToSidebarPage(e.target.getAttribute("data-navigate-to"));
		});
	});

	// toggle sidebar
	dom.toggleSidebar.addEventListener("click", _ => toggleSidebar());

	// back button
	dom.sbBack.addEventListener("click", function () {
		let page = currentPage.split("/").slice(0, -1).join("/") || "home"; // go back one layer, or go home
		navigateToSidebarPage(page);
	});

	// close button
	dom.sbClose.addEventListener("click", _ => toggleSidebar(false));
	
	// school page
	// create school options in sidebar
	schools.forEach(({ id, name, repo }) => {
		let option = document.createElement("option");
		option.value = repo;
		option.setAttribute("data-school-id", id);
		option.textContent = name;
		dom.schoolSelect.appendChild(option);
		if (settings.schoolId === id.toString()) {
			option.selected = true;
		}
	});
	// update school setting when changed
	dom.schoolSelect.addEventListener("change", function () {
		settings.schoolId = dom.schoolSelect.selectedOptions[0].getAttribute("data-school-id");
		updateSettings(true);
	});
	
	// enable clicking the middle status text
	dom.statusMiddle.addEventListener("click", function () {
		toggleSidebar(true);
		navigateToSidebarPage("school");
		dom.schoolSelect.focus();
	});
	
	// settings
	document.querySelectorAll("[data-setting-name]").forEach(settingInput => {
		let settingName = settingInput.getAttribute("data-setting-name");
		settingInput.addEventListener("change", _ => {
			settings[settingName] = ((settingInput.type === "checkbox") ? settingInput.checked : settingInput.value);
			updateSettings();
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
	
	navigateToSidebarPage("home");
}
