import {
	loaded,
	months,
	dom,
	pad0,
	msToTimeDiff,
	clockdata,
	settings,
	updateSettings
} from "./helper";
import activateSidebar from "./sidebar";
import "./main.css";

activateSidebar(dom, settings, updateSettings); // runs sidebar component w/ necessary dependencies (the dom tree)

// this function runs all the time
function tick () {
	let now = new Date();
	
	// update clock
	dom.time.textContent = "" + ((now.getHours() % 12) || 12) + ":" + pad0(now.getMinutes(), 2);
	dom.date.textContent = "" + months[now.getMonth()] + " " + now.getDate() + ", " + now.getFullYear();
	
	// if clockdata has loaded
	if ("version" in clockdata) {
		dom.statusMiddle.textContent = (window.innerWidth > 500) ? clockdata.metadata.school : clockdata.metadata.shortName;
		// if page has loaded, but no school is selected, dom.statusMiddle should show a "link" that will open the school page in the sidebar to set the school
	} else {
		dom.statusMiddle.textContent = "";
	}
	
	// TODO: let's fill with false information for now to get a sense of layout. fix this soon!
	if ("version" in clockdata) {
		let fakePeriodNumber = (now.getHours() % 6) + 1;
		dom.period.textContent = "" + fakePeriodNumber +
			((fakePeriodNumber === 1) ? "st" : (
				(fakePeriodNumber === 2) ? "nd" : (
					(fakePeriodNumber === 3) ? "rd" : "th"
				)
			)) + " period (simulated)";
		let startOfPeriod = new Date(now);
		startOfPeriod.setHours(startOfPeriod.getHours(), 0, 0, 0);
		let endOfPeriod = new Date(now);
		endOfPeriod.setHours(endOfPeriod.getHours() + 1, 0, 0, 0);
		dom.timeLeft.textContent = msToTimeDiff(endOfPeriod - now) + " left";
		dom.timeOver.textContent = msToTimeDiff(now - startOfPeriod) + " over";
	} else {
		dom.period.textContent = "";
		dom.timeLeft.textContent = "";
		dom.timeOver.textContent = "";
	}
	
	// request next tick
	requestAnimationFrame(tick);
}

requestAnimationFrame(tick);

// on page load
window.addEventListener("load", () => loaded());
// dom.toggleSidebar.click();

// set up sw.js if supported
if ("serviceWorker" in navigator) {
	navigator.serviceWorker.register("./sw.js");
}
