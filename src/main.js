window.tc22 = {};
import {
	clockdata,
	dom,
	getExperiment,
	clockdataSetYet,
	updateTimingsTable,
	escapeHtml,
	msToTimeDiff,
	writeText,
	isVpipActive,
	appliesStrarrListify,
	popup,
} from "./util";
import {
	settings,
	updateSettings,
	reidentifyUser,
} from "./settings";
import "./main.css";
import "./sidebar";
import audio from "./audio";
import { stopwatchData, timerData } from "./widgets";
import "./keybinds";

// assign all imported properties to window for availability in eval
// not all modules imported here because their exports are already taken above
import * as utilExports from "./util";
import * as clockdataExports from "./clockdata";
import * as settingsExports from "./settings";
import * as sidebarExports from "./sidebar";
import * as migrateV1ToV2Exports from "./migrate-v1-to-v2";
import * as luxonExports from "luxon";
Object.assign(window, utilExports, clockdataExports, settingsExports, sidebarExports, migrateV1ToV2Exports, luxonExports);

/////
// Spooky theme phased out of usage Dec 7, 2025 UTC.
// This code migrates users off of the spooky theme, but we need a generic solution to fix bad settings to reasonable settings (like this automatically goes to "dark" theme). Once the described solution is built, we can remove this.
if (settings.backgroundTheme === "spooky") {
	settings.backgroundTheme = "dark";
	updateSettings(false);
	popup(`<p><b>Poof! Spooky theme's gone.</b></p><p>We noticed you were still using Spooky theme. As the seasons change, themes come and go, so unfortunately, Spooky theme is now gone. You can enable the Winter theme if you're interested in the new seasonal theme! We've set your theme to Dark for now, though, since that's the default. Click this popup to close it.</p>`);
}
/////

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
			timerBtnStart.classList.toggle("hidden", true);
			timerBtnStop.classList.toggle("hidden", true);
			timerBtnReset.classList.toggle("hidden", false);
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
		setContent("statusMiddle", isSmallScreen ? clockdata.getSchoolShortName() : clockdata.getSchoolName());
	} else if (clockdataSetYet) { // special property if clockdata is loaded but empty (no school selected instead of not loaded yet)
		if (dom.statusMiddle.textContent !== "Select school") {
			setHtml("statusMiddle", `<span tabindex="0" role="link" class="linklike">Select school</span>`);
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
			
			let duration = clockdata.stringToLuxonDuration(timeFound.applies);
			if (timeFound.hideStart) setContent("timeOver", "");
			else setContent("timeOver", msToTimeDiff(-duration.start.diffNow()) + " over");
			if (timeFound.hideEnd) setContent("timeLeft", "");
			else setContent("timeLeft", msToTimeDiff(+duration.end.diffNow()) + " left");
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
		let currentScheduleMsg = `<p>Today, ${escapeHtml(clockdata.getSchoolShortName())} is on <b>${escapeHtml(todaysSchedule.label)}</b> ${fdoOccasion ? "override schedule" : "schedule"}.${fdoOccasion ? (` The reason for this is ${escapeHtml(fdoOccasion)}, which is during ${appliesStrarrListify(todaysSchedule.override.applies)}.`) : ""}</p>`;
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
function createFullscreenPlaceholder () {
	let placeholder = document.createElement("button");
	placeholder.id = "fullscreenPlaceholder";
	placeholder.textContent = "Click here to return content.";
	placeholder.addEventListener("click", _ => {
		unPipWindow();
		window.documentPictureInPicture?.window?.close?.();
	});
	return placeholder;
}

// this function handles the CLOSING of the simulated fullscreen
dom.fullscreen.addEventListener("click", _ => {
	simulatedFullscreenToggle(dom.fullscreen.lastChild);
});

function exitSimulatedFullscreen () {
	let placeholder = document.getElementById("fullscreenPlaceholder");
	if (placeholder && dom.fullscreen.lastChild) {
		placeholder.before(dom.fullscreen.lastChild); // i.e., first and only child
		placeholder.remove();
	}
	dom.fullscreen.classList.remove("fullscreenPresent");
	dom.buttonsBar.classList.remove("hold-then-fade");
	let fadeOutAnim = dom.buttonsBar.getAnimations()[0];
	if (fadeOutAnim) fadeOutAnim.cancel();
}

dom.pipVideo.srcObject = dom.pipCanvas.captureStream(24);
if ((!window.documentPictureInPicture) && (!document.pictureInPictureEnabled)) {
	dom.pipSettingDetails.textContent = "You don't have the PiP feature available in your browser, so this cannot be enabled. Sorry!";
	dom.settingPipEnabled.disabled = true;
	settings.pipEnabled = false;
	updateSettings();
} else if ((!window.documentPictureInPicture) && document.pictureInPictureEnabled && window.navigator.standalone) {
	dom.pipSettingDetails.textContent = "Unfortunately, PiP doesn't work in the homescreen web app (what you are currently using). :( Try the browser?";
	dom.settingPipEnabled.disabled = true;
	settings.pipEnabled = false;
	updateSettings();
}

async function simulatedFullscreenToggle (element) {
	let placeholder = document.getElementById("fullscreenPlaceholder");
	let mode = "display";
	const isEntering = ((!placeholder) && (!window.documentPictureInPicture?.window));
	const isExiting = ((placeholder) && (!window.documentPictureInPicture?.window));
	if (isExiting && !settings.pipEnabled) {
		exitSimulatedFullscreen();
		
		umami.track("simulated-fullscreen-exited", {
			"id": element.id,
			"mode": mode,
		});
		return;
	}
	
	if (isEntering) {
		placeholder = createFullscreenPlaceholder();
		element.after(placeholder);
		dom.fullscreen.append(element);
		dom.buttonsBar.classList.add("hold-then-fade");
		dom.fullscreen.classList.add("fullscreenPresent");
	} else if (isExiting) {
		dom.buttonsBar.classList.remove("hold-then-fade");
		dom.fullscreen.classList.remove("fullscreenPresent");
	}
	
	
	if (settings.pipEnabled) {
		 if (window.documentPictureInPicture) { // can do document pip! (dpip)
			mode = "dpip";
			// experiment enabled, no window yet
			if (!window.documentPictureInPicture?.window) { // if no pip window (so, enter)
				const pipWindow = await window.documentPictureInPicture.requestWindow({
					"width": 400,
					"height": 200,
				});
				
				pipWindow.addEventListener("pagehide", _ => {
					unPipWindow();
				});
				
				[...document.styleSheets].forEach((styleSheet) => {
					try {
						const cssRules = [...styleSheet.cssRules]
							.map((rule) => rule.cssText)
							.join("");
						const style = document.createElement("style");

						style.textContent = cssRules;
						pipWindow.document.head.appendChild(style);
					} catch (e) {
						const link = document.createElement("link");

						link.rel = "stylesheet";
						link.type = styleSheet.type;
						link.media = styleSheet.media;
						link.href = styleSheet.href;
						pipWindow.document.head.appendChild(link);
					}
				});
				[...document.documentElement.attributes].forEach(attribute => pipWindow.document.documentElement.setAttribute(attribute.name, attribute.value));
				dom.closeBtn.addEventListener("click", _ => {
					unPipWindow();
					window.documentPictureInPicture.window.close();
				});
				pipWindow.addEventListener("focus", _ => pipWindow.document.documentElement.classList.add("windowFocused"));
				pipWindow.addEventListener("blur", _ => pipWindow.document.documentElement.classList.remove("windowFocused"));

				// Move the player to the Picture-in-Picture window.
				pipWindow.document.body.appendChild(dom.fullscreen);
				dom.fullscreen.style.pointerEvents = "none";
				pipWindow.document.body.append(dom.closeBtn);
			} else { // if pip window (so, switch)
				let fromId = dom.fullscreen.lastChild?.id;
				placeholder.before(dom.fullscreen.lastChild);
				element.after(placeholder);
				dom.fullscreen.append(element);
				
				umami.track("simulated-fullscreen-switched", {
					"from": fromId,
					"to": element.id,
					"mode": mode, // dpip
				});
				return;
			}
		} else if (document.pictureInPictureEnabled) { // can do video pip! (vpip)
			mode = "vpip";
			if (isEntering && !isVpipActive()) { // if no pip window (so, enter)
				if (!dom.pipVideo.srcObject) dom.pipVideo.srcObject = dom.pipCanvas.captureStream(24);
				let ctx = dom.pipCanvas.getContext("2d");
				let styles = getComputedStyle(document.documentElement);
				ctx.fillStyle = styles.backgroundColor;
				ctx.fillRect(0, 0, dom.pipCanvas.width, dom.pipCanvas.height);
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillStyle = styles.color;
				
				let cancelTime = 0;
				function updateCanvas () {
					ctx.fillStyle = styles.backgroundColor;
					ctx.fillRect(0, 0, dom.pipCanvas.width, dom.pipCanvas.height);
					ctx.fillStyle = styles.color;
					writeText(ctx, element.textContent);
					
					// if in vpip, schedule next frame :D
					window.tc22.vpipAnimFrameId = requestAnimationFrame(updateCanvas);
					if (isVpipActive()) {
						cancelTime = 0;
					} else {
						// not in vpip? give it 5 seconds to load
						if (cancelTime === 0) {
							cancelTime = Date.now() + 5000;
						}
						// it's been 5 seconds? cancel the updating to save energy
						else if (Date.now() > cancelTime) cancelAnimationFrame(window.tc22.vpipAnimFrameId);
					}
				}
				function requestVPip () {
					if (isVpipActive()) return;
					
					window.tc22.pipElement = element;
					if (dom.pipVideo.webkitSupportsPresentationMode && typeof dom.pipVideo.webkitSetPresentationMode === "function") {
						dom.pipVideo.webkitSetPresentationMode("picture-in-picture");
						window.tc22.vpipAnimFrameId = requestAnimationFrame(updateCanvas);
					} else {
						dom.pipVideo.requestPictureInPicture?.()?.then(_ => window.tc22.vpipAnimFrameId = requestAnimationFrame(updateCanvas));
					}
				}
				if (dom.pipVideo.readyState >= dom.pipVideo.HAVE_CURRENT_DATA) requestVPip();
				else dom.pipVideo.addEventListener("loadedmetadata", _ => requestVPip());
			} else { // if pip window (so, exit)
				if (isVpipActive()) document.exitPictureInPicture();
				exitSimulatedFullscreen();
				
				umami.track("simulated-fullscreen-exited", {
					"id": element.id,
					"mode": mode, // vpip
				});
				return;
			}
		}
	} else {
	}
	
	if (!isEntering && placeholder) { // remove placeholder unless entering created it
		placeholder.before(dom.fullscreen.lastChild); // i.e., first and only child
		placeholder.remove();
	}
	
	if (isEntering) umami.track("simulated-fullscreen-entered", {
		"id": element.id,
		"mode": mode,
	});
}

function unPipWindow () {
	dom.fullscreenContainer.appendChild(dom.fullscreen);
	dom.fullscreen.style.pointerEvents = "all";
	document.body.appendChild(dom.closeBtn);
	exitSimulatedFullscreen();
	
	umami.track("simulated-fullscreen-exited", {
		"id": "", // unPipWindow cannot know the element being removed
		"mode": "dpip",
	});
}
document.querySelectorAll("[data-fullscreenable]").forEach(el => {
	// this function handles the OPENING of the simulated fullscreen
	el.addEventListener("click", _ => {
		simulatedFullscreenToggle(el);
	});
});

// installer button
let installPrompt = null;

window.addEventListener("beforeinstallprompt", e => {
	e.preventDefault();
	installPrompt = e;
	dom.downloadPwa.classList.remove("hidden");
});
window.addEventListener("appinstalled", _ => {
	dom.downloadPwa.classList.add("hidden");
});
dom.downloadPwa.addEventListener("click", async _ => {
	if (!installPrompt) return;
	const result = await installPrompt.prompt(); // "accepted" | "dismissed"
	if (result.outcome === "accepted") {
		popup("<p>Pin me to your taskbar or add me to your homescreen for easy access!<br><small>Click this popup to close it.</small></p>");
	}
	dom.downloadPwa.classList.add("hidden");
	
	umami.track("get-pwa-clicked", {
		"outcome": result.outcome,
	});
});

// more menu
dom.toggleFullscreen.addEventListener("click", e => {
	e.stopPropagation();
	if (!document.fullscreenElement) {
		document.documentElement.requestFullscreen()
			.then(_ => {
				dom.toggleFullscreen.textContent = "Exit fullscreen";
			});
	} else {
		document.exitFullscreen()
			.then(_ => {
				dom.toggleFullscreen.textContent = "Enter fullscreen";
			});
	}
	
	umami.track("toggle-fullscreen-clicked", {
		"attemptedNewState": (document.fullscreenElement ? "no-fullscreen" : "fullscreen"),
	});
});
document.addEventListener("fullscreenchange", _ => {
	if (!document.fullscreenElement) dom.toggleFullscreen.textContent = "Enter fullscreen";
	else dom.toggleFullscreen.textContent = "Exit fullscreen";
});
if (!document.fullscreenEnabled) {
	dom.toggleFullscreen.classList.add("hidden");
}

// developers
dom.evalBtn.addEventListener("click", _ => {
	try {
		eval(dom.evalJs.value);
	} catch (e) {
		alert(e);
	}
});

// analytics
reidentifyUser();

// all underlay managing code is here
import "./underlays";

// keeps track of when page is fully loaded
let loadFlags = 0;
let threshold = 1; // waiting for 1 flag: window.onload
export function loaded (weight) {
	// if loaded already did its work, don't make it do it again
	if (threshold < 0) return;
	
	if (!navigator.onLine) threshold = 1; // just wait for load
	loadFlags += (weight ? weight : 1);
	if (loadFlags >= threshold) {
		dom.loadingScreen.classList.add("exitDown");
		dom.loadingScreen.addEventListener("animationend", _ => dom.loadingScreen.classList.add("hidden"));
		document.documentElement.classList.remove("stillLoading");
		console.log("finished loading!");
		threshold = -1;
	}
}
setTimeout(_ => loaded(999999), 3000); // after 3 seconds, force the site to load so user is not stuck on loading screen

// on page load
if (document.readyState === "complete") loaded();
else window.addEventListener("load", () => loaded());

// set up sw.js if supported
if ("serviceWorker" in navigator) {
	navigator.serviceWorker.register("./sw.js");
}
