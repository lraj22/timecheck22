// 2026-01-15-pip.js - Contains PiP (Picture-in-Picture) experiment
// Enables students to access the time/timeLeft/timeOver easier using PiP windows!

import { getExperimentData, setExperimentDataKey } from "../experiments";
const experimentId = "2026-01-15-pip";

function isValidPage () {
	return ["/", "/index.html"].includes(location.pathname);
}

export function init () {
	if (!isValidPage()) {
		console.log("[pip] This experiment is only supported on the main clock page.");
		return;
	}
	
	let data = getExperimentData(experimentId);
	let togglePip = document.createElement("span");
	togglePip.id = "togglePip";
	togglePip.textContent = data.usePip ? "Disable PiP" : "Enable PiP";
	togglePip.setAttribute("data-state", data.usePip ? "yes" : "no");
	setExperimentDataKey(experimentId, "usePip", !!data.usePip);
	togglePip.addEventListener("click", _ => {
		let newState = togglePip.getAttribute("data-state") === "yes" ? false : true;
		
		if (newState === true) {
			if ((!window.documentPictureInPicture) && (!document.pictureInPictureEnabled)) {
				alert("You don't have the PiP feature available in your browser, so this cannot be enabled. Sorry!");
				setExperimentDataKey(experimentId, "usePip", false);
				return;
			} else if ((!window.documentPictureInPicture) && document.pictureInPictureEnabled && window.navigator.standalone) {
				alert("Unfortunately, the PiP feature is not available in the homescreen web app (what you are currently using). :(\n\nYou will need the browser to use PiP.");
				setExperimentDataKey(experimentId, "usePip", false);
				return;
			}
		}
		
		setExperimentDataKey(experimentId, "usePip", newState);
		togglePip.textContent = newState ? "Disable PiP" : "Enable PiP";
		togglePip.setAttribute("data-state", newState ? "yes" : "no");
		if (newState === false) window.documentPictureInPicture?.window?.close?.();
	});
	let dropContent = document.getElementById("moreBtn").parentElement.querySelector(".dropdown-content");
	dropContent.appendChild(togglePip);
	
	console.log("[pip] Initialized!");
}

export function cleanup () {
	if (!isValidPage()) {
		console.log("[pip] This experiment is only supported on the main clock page.");
		return;
	}
	
	setExperimentDataKey(experimentId, "usePip", false);
	document.getElementById("togglePip")?.remove?.();
	
	console.log("[pip] Cleaned up!");
}
