import {
	clockdata,
	dom,
	updateTimingsTable,
	escapeHtml,
	msToTimeDiff,
	appliesStrarrListify,
} from "./util";
import { stringToLuxonDuration } from "./clockdata";
import {
	settings,
	updateSettings,
} from "./settings";
import "./main.css";
import activateSidebar from "./sidebar";
activateSidebar(dom, settings, updateSettings); // runs sidebar component w/ necessary dependencies (the dom tree)
import { DateTime } from "luxon";
import audio from "./audio";
import { stopwatchData, timerData } from "./widgets";
import "./spooky"; // spooky time!

function setContent (id, content) {
	if (dom[id].textContent !== content) dom[id].textContent = content;
}
function setHtml (id, html) {
	if (dom[id].innerHTML !== html) dom[id].innerHTML = html;
}

// this function runs all the time
let oldAnnouncements = [];
let oldTimings = [];
function tick () {
	let now = clockdata.getNowLuxon();
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
			if (!timerData.isMuted) audio.play("timerRing");
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
	let cd = clockdata.clockdata;
	if ("version" in cd) {
		setContent("statusMiddle", (isSmallScreen) ? (cd.metadata.short_name || cd.metadata.shortName) : (cd.metadata.school_name || cd.metadata.school));
	} else if (cd.hasNothing) { // special property if clockdata is loaded but empty (no school selected instead of not loaded yet)
		if (dom.statusMiddle.textContent !== "Select school") {
			setHtml("statusMiddle", `<a class="linklike">Select school</a>`);
		}
	} else {
		setContent("statusMiddle", "");
	}
	
	if ("version" in cd) {
		// handle announcements
		let currentAnnouncements = clockdata.getAnnouncementsByTime(now).map(announcement => announcement.message);
		
		if (currentAnnouncements.join("") !== oldAnnouncements.join("")) { // check if any updates to the announcements (probably not honestly)
			dom.announcements.innerHTML = "";
			
			// add announcements
			currentAnnouncements.forEach((announcement) => {
				let el = document.createElement("div");
				el.className = "announcement";
				el.innerHTML = announcement; // WARNING: school managers have implied HTML power in their announcements!
				dom.announcements.appendChild(el);
			});
			
			console.groupCollapsed("Updating announcements");
			console.log("old", oldAnnouncements);
			console.log("new", currentAnnouncements);
			console.groupEnd("updating announcements");
			
			oldAnnouncements = currentAnnouncements;
		}
		
		let timeFound = clockdata.getTimingByTime(now);
		if (timeFound) {
			setContent("period", timeFound.label);
			
			let duration = stringToLuxonDuration(timeFound.applies);
			if (!time.hideStart) setContent("timeOver", msToTimeDiff(-duration.start.diffNow()) + " over");
			else setContent("timeOver", "");
			if (!time.hideEnd) setContent("timeLeft", msToTimeDiff(+duration.end.diffNow()) + " left");
			else setContent("timeLeft", "");
		} else {
			setContent("period", "");
			setContent("timeLeft", "");
			setContent("timeOver", "");
		}
		
		// if new timings for the schedule - update table
		let todaysSchedule = clockdata.getScheduleByDay(now);
		let currentTimings = (Array.isArray(todaysSchedule.timings) ? todaysSchedule.timings : Object.entries(todaysSchedule.timings));
		if (oldTimings.join("\n") !== currentTimings.join("\n")) {
			oldTimings = currentTimings;
			updateTimingsTable();
		}
		
		// write sidebar message
		let fdoOccasion = (("override" in todaysSchedule) ? (todaysSchedule.override.occasion || todaysSchedule.override.name) : null);
		let currentScheduleMsg = `<p>Today, ${escapeHtml(cd.metadata.short_name || cd.metadata.shortName)} is on <b>${escapeHtml(todaysSchedule.label)}</b> ${fdoOccasion ? "override schedule" : "schedule"}.${fdoOccasion ? (` The reason for this is ${escapeHtml(fdoOccasion)}, which is during ${appliesStrarrListify(todaysSchedule.override.applies)}.`) : ""}</p>`;
		if (timeFound && timeFound.isOverride) {
			currentScheduleMsg += `<p>Currently, though, the schedule is on the following timeframe: <b>${escapeHtml(timeFound.occasion || timeFound.name)}</b>. It lasts from ${appliesStrarrListify(timeFound.duration)}.</p>`;
		}
		setHtml("scheduleMessage", currentScheduleMsg);
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

// all underlay managing code is here
import "./underlays";

// keeps track of when page is fully loaded
let loadFlags = 0;
export function loaded () {
	var threshold = 1; // waiting for 1 flag: window.onload
	if (!navigator.onLine) threshold = 1; // just wait for load
	loadFlags++;
	if (loadFlags >= threshold) {
		console.log("finished loading!");
	}
}

// on page load
window.addEventListener("load", () => loaded());

// set up sw.js if supported
if ("serviceWorker" in navigator) {
	navigator.serviceWorker.register("./sw.js");
}
