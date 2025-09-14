import {
	loaded,
	months,
	dom,
	pad0,
	msToTimeDiff,
	clockdata,
	settings,
	updateSettings,
	stringToLuxonDuration,
	getSchedule
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
		
		let timeframeOverrides = clockdata.timeframe_overrides.map(tfo => {
			tfo.isOverride = true; // add override metadata
			return tfo;
		});
		let currentSchedule = Object.entries(getSchedule()).map(([name, applies]) => {
			return { // same data, in different format to make it easier to parse
				"applies": applies,
				"description": name,
				"isOverride": false,
			};
		});
		let timesToday = [
			...timeframeOverrides,
			...currentSchedule,
		];
		
		let timeFound = false;
		for (const time of timesToday) {
			for (const duration of time.applies) {
				let appliesDuration = stringToLuxonDuration(duration);
				let doesApply = appliesDuration.contains(now);
				if (!doesApply) continue; // doesn't apply, continue
				
				timeFound = true;
				// TODO: if override (time.isOverride), make sure to let user know
				dom.period.textContent = time.description;
				dom.timeOver.textContent = msToTimeDiff(-appliesDuration.start.diffNow()) + " over";
				dom.timeLeft.textContent = msToTimeDiff(+appliesDuration.end.diffNow()) + " left";
				break;
			}
			if (timeFound) break;
		}
		if (!timeFound) {
			dom.period.textContent = "";
			dom.timeLeft.textContent = "";
			dom.timeOver.textContent = "";
		}
		
		
		
		
		
		
		
		// // let's fill with false information for now to get a sense of layout. fix this soon!
		// let fakePeriodNumber = (now.hour % 6) + 1;
		// dom.period.textContent = "" + fakePeriodNumber +
		// 	((fakePeriodNumber === 1) ? "st" : (
		// 		(fakePeriodNumber === 2) ? "nd" : (
		// 			(fakePeriodNumber === 3) ? "rd" : "th"
		// 		)
		// 	)) + " period (simulated)";
		// // let startOfPeriod = new Date(now);
		// let startOfPeriod = now.startOf("hour");
		// // startOfPeriod.setHours(startOfPeriod.hour, 0, 0, 0);
		// // let endOfPeriod = new Date(now);
		// let endOfPeriod = now.endOf("hour");
		// // endOfPeriod.setHours(endOfPeriod.hour + 1, 0, 0, 0);
		// dom.timeLeft.textContent = msToTimeDiff(endOfPeriod - now) + " left";
		// dom.timeOver.textContent = msToTimeDiff(now - startOfPeriod) + " over";
	} else {
		dom.announcements.innerHTML = "";
		oldAnnouncements = [];
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
