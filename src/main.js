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
	escapeHtml,
} from "./helper";
import activateSidebar from "./sidebar";
import "./main.css";
import { DateTime } from "luxon";
import { audioPlay } from "./audio";
import { stopwatchData, timerData } from "./widgets";

activateSidebar(dom, settings, updateSettings); // runs sidebar component w/ necessary dependencies (the dom tree)

function setContent (id, content) {
	if (dom[id].textContent !== content) dom[id].textContent = content;
}
function setHtml (id, html) {
	if (dom[id].innerHTML !== html) dom[id].innerHTML = html;
}

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
	setHtml("time", formattedTime);
	setContent("date", now.toFormat((isSmallScreen ? "LLL" : "LLLL") + " d, yyyy"));
	
	// stopwatch & timer
	if (stopwatchData.running) {
		let timePassed = stopwatchData.total + (performance.now() - stopwatchData.startTime);
		let timePassedStr = msToTimeDiff(Math.floor(timePassed), function (seconds) {
			return parseFloat(seconds.toFixed(2));
		}, 2);
		stopwatchTime.textContent = timePassedStr;
	}
	if (timerData.running) {
		let timeLeft = timerData.total - (performance.now() - timerData.startTime);
		if (timeLeft <= 0) {
			timeLeft = 0;
			timerData.running = false;
			timerData.total = 0;
			timerTime.disabled = false;
			timerBtnPlay.classList.toggle("hidden", true);
			timerBtnPause.classList.toggle("hidden", true);
			timerBtnRestart.classList.toggle("hidden", false);
			if (!timerData.isMuted) audioPlay("timerRing");
		}
		timeLeft = Math.floor(timeLeft);
		let afterDigits = 0;
		if (timeLeft <= 10e3) afterDigits = 1;
		if (timeLeft < 5e3) afterDigits = 2;
		if (timeLeft === 0) afterDigits = 0;
		let timeLeftStr = msToTimeDiff(Math.floor(timeLeft), function (seconds) {
			return afterDigits ? parseFloat(seconds.toFixed(afterDigits)) : Math.ceil(seconds);
		}, afterDigits).replace("s", "");
		timerTime.value = timeLeftStr;
	}
	
	// if clockdata has loaded
	if ("version" in clockdata) {
		setContent("statusMiddle", (isSmallScreen) ? clockdata.metadata.shortName : clockdata.metadata.school);
	} else if (clockdata.hasNothing) {
		if (dom.statusMiddle.textContent !== "Select school") {
			setHtml("statusMiddle", `<a class="linklike">Select school</a>`);
		}
	} else {
		setContent("statusMiddle", "");
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
				setContent("period", time.description);
				setContent("timeOver", msToTimeDiff(-appliesDuration.start.diffNow()) + " over");
				setContent("timeLeft", msToTimeDiff(+appliesDuration.end.diffNow()) + " left");
				break;
			}
			if (timeFound) break;
		}
		if (!timeFound) {
			setContent("period", "");
			setContent("timeLeft", "");
			setContent("timeOver", "");
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
			setHtml("scheduleMessage", currentScheduleMsg);
			oldScheduleMsg = currentScheduleMsg;
		}
	} else {
		setHtml("announcements", "");
		oldAnnouncements = [];
		setContent("period", "");
		setContent("timeLeft", "");
		setContent("timeOver", "");
	}
	
	// request next tick
	requestAnimationFrame(tick);
}

requestAnimationFrame(tick);

// fullscreenable elements
document.querySelectorAll("[data-fullscreenable]").forEach(el => {
	el.addEventListener("click", _ => {
		let placeholder = document.getElementById("fullscreenPlaceholder");
		if (placeholder) {
			// move element back to placeholder
			placeholder.before(el);
			placeholder.remove();
			dom.fullscreen.classList.remove("fullscreenPresent");
		} else {
			// add placeholder for element later, move element to fullscreening area
			placeholder = document.createElement("div");
			placeholder.id = "fullscreenPlaceholder";
			el.after(placeholder);
			dom.fullscreen.append(el);
			dom.fullscreen.classList.add("fullscreenPresent");
		}
	});
});

// on page load
window.addEventListener("load", () => loaded());

// set up sw.js if supported
if ("serviceWorker" in navigator) {
	navigator.serviceWorker.register("./sw.js");
}
