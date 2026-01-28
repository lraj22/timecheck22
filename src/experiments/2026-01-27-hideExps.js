// 2026-01-27-hideExps.js - Hide the Experiments tab from view!
// Especially useful when wanting to keep experiments enabled, but hiding it from the UI.

// this experiment doesn't use any stored data
import { getExperimentData, setExperimentDataKey } from "../experiments";
import { navigateToSidebarPage, toggleSidebar } from "../sidebar";
const experimentId = "2026-01-27-hideExps";

function isValidPage () {
	return document.documentElement.getAttribute("data-page-id") === "index";
}

export function init () {
	if (!isValidPage()) {
		console.log("[hideExps] This experiment is only supported on the main clock page.");
		return;
	}
	
	dom.experimentsOption.classList.add("hidden");
	let experimentsLabel = document.querySelector("#settingExperimentsEnabled + label");
	let experimentsButton = document.createElement("button");
	experimentsButton.id = "goToExperiments";
	experimentsButton.textContent = "Go to Experiments tab";
	experimentsButton.classList.add("flatBtn");
	experimentsButton.style.fontSize = "revert";
	experimentsButton.addEventListener("click", _ => {
		navigateToSidebarPage("experiments");
		toggleSidebar(true);
	});
	
	// add two <br>'s and then the button after the label for the experiments setting
	experimentsLabel.after(experimentsButton);
	experimentsButton.before(document.createElement("br"));
	experimentsButton.before(document.createElement("br"));
	
	console.log("[hideExps] Initialized!");
}

export function cleanup () {
	if (!isValidPage()) {
		console.log("[hideExps] This experiment is only supported on the main clock page.");
		return;
	}
	
	dom.experimentsOption.classList.remove("hidden");
	let experimentsButton = document.getElementById("goToExperiments");
	experimentsButton.previousElementSibling.remove(); // <br>
	experimentsButton.previousElementSibling.remove(); // <br>
	experimentsButton.remove(); // itself
	
	console.log("[hideExps] Cleaned up!");
}
