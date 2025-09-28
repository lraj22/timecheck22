import {
	loaded,
	dom,
	msToTimeDiff,
	clockdata,
	settings,
	updateSettings,
	stringToLuxonDuration,
	getSchedule,
	updateTimingsTable,
	escapeHtml
} from "./helper";
import activateSidebar from "./sidebar";
import "./main.css";
import { DateTime } from "luxon";

activateSidebar(dom, settings, updateSettings); // runs sidebar component w/ necessary dependencies (the dom tree)

// this function runs all the time
let oldAnnouncements = [];
let oldTimings = [];
let oldScheduleMsg = "";
function tick () {
	let now = DateTime.local({
		"zone": (("metadata" in clockdata) ? clockdata.metadata.timezone : undefined),
	});
	let isSmallScreen = (window.innerWidth <= 500);
	
	// update clock
	let isColonOnBlink = ((now.ts % 2000) < 1000);
	let formattedTime = now.toLocaleString({
		"hour": "numeric",
		"minute": "2-digit",
		"hour12": ({
			"auto": undefined,
			"twentyFour": false,
			"twelve": true,
			"twelveAMPM": true,
		}[settings.hourFormat]),
	});
	if (!(["auto", "twelveAMPM"].includes(settings.hourFormat))) formattedTime = formattedTime.split(" ")[0];
	formattedTime = formattedTime.replaceAll(/( [AP]M)/ig, `<span class="timeSmall">$1</span>`)
	if (settings.colonBlinkEnabled && isColonOnBlink) formattedTime = formattedTime.replaceAll(":", `<span class="v-hidden">:</span>`)
	dom.time.innerHTML = formattedTime;
	dom.date.textContent = now.toFormat((isSmallScreen ? "LLL" : "LLLL") + " d, yyyy");
	
	// if clockdata has loaded
	if ("version" in clockdata) {
		dom.statusMiddle.textContent = (isSmallScreen) ? clockdata.metadata.shortName : clockdata.metadata.school;
	} else if (clockdata.hasNothing) {
		if (dom.statusMiddle.textContent !== "Select school") {
			dom.statusMiddle.innerHTML = `<a class="linklike">Select school</a>`;
		}
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
		
		if (currentAnnouncements.join("") !== oldAnnouncements.join("")) { // check if any updates to the announcements (probably not honestly)
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
		let scheduleData = getSchedule();
		let timings = Object.entries(scheduleData.timings);
		let currentSchedule = timings.map(([name, applies]) => {
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
				
				timeFound = {
					...time,
					appliesDuration,
				};
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
		
		// if new timings for the schedule - update table
		let currentTimings = timings.flat();
		if (oldTimings.join("\n") !== currentTimings.join("\n")) {
			oldTimings = currentTimings;
			updateTimingsTable();
		}
		
		// write sidebar message
		let currentScheduleMsg = `<p>Today, ${escapeHtml(clockdata.metadata.shortName)} is on <b>${escapeHtml(scheduleData.label)}</b> ${scheduleData.isOverride ? "override schedule" : "schedule"}.</p>`;
		if (timeFound.isOverride) {
			currentScheduleMsg += `<p>Currently, though, the schedule is on the following timeframe: <b>${escapeHtml(timeFound.name)}</b>. It lasts from ${timeFound.appliesDuration.toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS)}.</p>`;
		}
		
		if (oldScheduleMsg !== currentScheduleMsg) {
			dom.scheduleMessage.innerHTML = currentScheduleMsg;
			oldScheduleMsg = currentScheduleMsg;
		}
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

// set up sw.js if supported
if ("serviceWorker" in navigator) {
	navigator.serviceWorker.register("./sw.js");
}
