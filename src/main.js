import {
	loaded,
	months,
	dom,
	pad0,
	msToTimeDiff,
	clockdata,
	settings,
	updateSettings,
	stringToLuxonDuration
} from "./helper";
import activateSidebar from "./sidebar";
import "./main.css";
import { DateTime } from "luxon";

activateSidebar(dom, settings, updateSettings); // runs sidebar component w/ necessary dependencies (the dom tree)

// this function runs all the time
let oldAnnouncements = [];
function tick () {
	let now = DateTime.local({
		"zone": (("metadata" in clockdata) ? clockdata.metadata.timezone : undefined),
	});
	let isSmallScreen = (window.innerWidth <= 500);
	
	// update clock
	dom.time.textContent = now.toFormat("h:mm");
	dom.date.textContent = now.toFormat((isSmallScreen ? "LLL" : "LLLL") + " d, yyyy");
	
	// if clockdata has loaded
	if ("version" in clockdata) {
		dom.statusMiddle.textContent = (isSmallScreen) ? clockdata.metadata.shortName : clockdata.metadata.school;
		// if page has loaded, but no school is selected, dom.statusMiddle should show a "link" that will open the school page in the sidebar to set the school
	} else {
		dom.statusMiddle.textContent = "";
	}
	
	if ("version" in clockdata) {
		// handle announcements
		let currentAnnouncements = [];
		clockdata.announcements.forEach(announcement => {
			// check if announcement is valid right now
			let appliesAtAll = announcement.applies.some(range => {
				let duration = stringToLuxonDuration(range);
				return duration.contains(now)
			});
			if (appliesAtAll) currentAnnouncements.push(announcement.message);
			
		});
		
		if (currentAnnouncements.join("") !== oldAnnouncements.join("")) { // check if any updates (probably not honestly)
			dom.announcements.innerHTML = "";
			
			// add announcements
			currentAnnouncements.forEach((announcement) => {
				let el = document.createElement("div");
				el.className = "announcement";
				el.innerHTML = announcement;
				dom.announcements.appendChild(el);
			});
			
			console.groupCollapsed("Updating announcements");
			console.log("old", oldAnnouncements);
			console.log("new", currentAnnouncements);
			console.groupEnd("updating announcements");
			
			oldAnnouncements = currentAnnouncements;
		}
		
		
		
		
		
		
		
		// TODO: let's fill with false information for now to get a sense of layout. fix this soon!
		let fakePeriodNumber = (now.hour % 6) + 1;
		dom.period.textContent = "" + fakePeriodNumber +
			((fakePeriodNumber === 1) ? "st" : (
				(fakePeriodNumber === 2) ? "nd" : (
					(fakePeriodNumber === 3) ? "rd" : "th"
				)
			)) + " period (simulated)";
		// let startOfPeriod = new Date(now);
		let startOfPeriod = now.startOf("hour");
		// startOfPeriod.setHours(startOfPeriod.hour, 0, 0, 0);
		// let endOfPeriod = new Date(now);
		let endOfPeriod = now.endOf("hour");
		// endOfPeriod.setHours(endOfPeriod.hour + 1, 0, 0, 0);
		dom.timeLeft.textContent = msToTimeDiff(endOfPeriod - now) + " left";
		dom.timeOver.textContent = msToTimeDiff(now - startOfPeriod) + " over";
	} else {
		dom.announcements.innerHTML = "";
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
