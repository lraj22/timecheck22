// keybinds.js - handles all the keyboard shortcuts!

import { dom } from "./util";
import { navigateToSidebarPage, toggleSidebar } from "./sidebar";
import { editor } from "./widgets";

// keyboard shortcuts
const isMac = /mac/i.test(navigator.userAgentData ? navigator.userAgentData.platform : navigator.platform);
function eventChordMatch (e, chord) {
	if (typeof chord !== "object") chord = {};
	if (!("shift" in chord)) chord.shift = false;
	if (!("ctrl" in chord)) chord.ctrl = false; // equivalent to Command Key on Mac
	if (!("alt" in chord)) chord.alt = false; // equivalent to Option Key on Mac
	if (!("super" in chord)) chord.super = false; // equivalent to Control Key on Mac, Windows Key on Windows
	
	let matches = true;
	if ((e.shiftKey !== chord.shift) && (chord.shift !== null)) matches = false;
	if ((e.altKey !== chord.alt) && (chord.alt !== null)) matches = false;
	if (isMac) {
		if ((e.metaKey !== chord.ctrl) && (chord.ctrl !== null)) matches = false;
		if ((e.ctrlKey !== chord.super) && (chord.super !== null)) matches = false;
	} else {
		if ((e.ctrlKey !== chord.ctrl) && (chord.ctrl !== null)) matches = false;
		if ((e.metaKey !== chord.super) && (chord.super !== null)) matches = false;
	}
	
	if ("key" in chord) {
		if (e.key.toLowerCase() !== chord.key.toLowerCase()) matches = false;
	}
	
	return matches;
}

let currentMelody = [];
function eventMelodyMatch (...melodies) {
	for (let melody of melodies) {
		let matches = true;
		if (typeof melody === "string") melody = melody.split("");
		for (let i = 0; i < melody.length; i++) {
			if (melody[melody.length - 1 - i] !== currentMelody[currentMelody.length - 1 - i]) {
				// whoops, no match. break and continue to next melody, if any
				matches = false;
				break;
			}
		}
		
		// okay, so we matched every part of the melody
		if (matches) return true;
	}
	
	// ah, we didn't match ANY of the melodies!
	return false;
}

window.addEventListener("keydown", e => {
	if (e.repeat) return; // we don't want people holding down Shift + F and their browser jumping up and down T-T
	
	if (eventChordMatch(e, {
		"key": "Escape",
	})) {
		currentMelody = [];
		document?.activeElement?.blur?.(); // blur document if necessary
		e.preventDefault();
		return;
	}
	
	if (e.target.matches("input, select, textarea, .ql-editor")) return; // don't trigger shortcuts when focused in editing area
	
	let actionComplete = false;
	
	// check matching chords (aka, multiple keys at once such as Shift + F for toggle fullscreen)
	if (eventChordMatch(e, {
		"shift": true,
		"key": "f",
	})) {
		dom.toggleFullscreen.click();
		actionComplete = true;
	}
	else if (eventChordMatch(e, {
		"ctrl": true,
		"key": "/",
	})) {
		navigateToSidebarPage("keyboardShortcuts");
		toggleSidebar(true);
		actionComplete = true;
	}
	
	if (actionComplete) {
		currentMelody = []; // they hit a valid chord, not attempting to do a melody
		e.preventDefault();
		return;
	}
	
	// check matching melodies (aka, multiple keys in a row NOT at the same time, such as 'fo' for fullscreening time over)
	if (eventChordMatch(e, { "shift": null, })) { // aka, no modifiers, just a key
		if (e.key !== "Shift") {
			currentMelody.push(e.key.toLowerCase());
			// console.log(e.key); // testing only
		}
		e.preventDefault();
	} else return; // unmatched chords should not accidentally hit melodies
	
	function simFullscreenEl (el) {
		if (dom.fullscreen.lastChild?.id === el.id) { // aka, if this element is already fullscreened
			dom.fullscreen.click();
			return;
		}
		dom.fullscreen.click(); // closes #fullscreen if open
		el.click(); // triggers data-fullscreenable if available
	}
	
	let matchedSomething = true;
	if (0); // no purpose; allow all the following to be "else if" :]
	// keyboard shortcuts help
	else if (eventMelodyMatch("?")) { // help what do I do[?]!
		navigateToSidebarPage("keyboardShortcuts");
		toggleSidebar(true);
	}
	// actual fullscreen
	else if (eventMelodyMatch("ff")) dom.toggleFullscreen.click(); // [f]ullscreen [f]or real (actual system fullscreen)
	// simulated fullscreen
	else if (eventMelodyMatch("ft")) simFullscreenEl(dom.time); // [f]ullscreen [t]ime
	else if (eventMelodyMatch("fo")) simFullscreenEl(dom.timeOver); // [f]ullscreen time [o]ver
	else if (eventMelodyMatch("fl")) simFullscreenEl(dom.timeLeft); // [f]ullscreen time [l]eft
	else if (eventMelodyMatch("fp")) simFullscreenEl(dom.period); // [f]ullscreen [p]eriod
	else if (eventMelodyMatch("fd")) simFullscreenEl(dom.date); // [f]ullscreen [d]ate
	else if (eventMelodyMatch("fx")) dom.fullscreen.click(); // [f]ullscreen e[x]it
	// sidebar
	else if (eventMelodyMatch("st")) dom.toggleSidebar.click(); // [s]idebar [t]oggle
	else if (eventMelodyMatch(["s", "enter"])) toggleSidebar(true); // [s]idebar open ([enter]=force open)
	else if (eventMelodyMatch("sx")) dom.sbClose.click(); // [s]idebar e[x]it
	else if (eventMelodyMatch(["s", "backspace"])) dom.sbBack.click(); // [s]idebar [backspace]=back
	else if (eventMelodyMatch("s ")) dom.sidebarLocation.dispatchEvent(new MouseEvent("dblclick")); // [s]idebar page ([space]=input)
	else if (eventMelodyMatch("sa")) { // [s]idebar open [a]bout page
		navigateToSidebarPage("about");
		toggleSidebar(true);
	}
	else if (/s\d+enter$/.test(currentMelody.join(""))) { // [s]idebar go to [number] page ([enter]=confirm)
		let optionNumber = parseInt(/s(\d+)enter$/.exec(currentMelody.join(""))[1]);
		let options = document.querySelectorAll(`.sbPage[data-page-name="home"] .sbOption`);
		optionNumber = Math.max(1, Math.min(optionNumber, options.length));
		options[optionNumber - 1].click();
		let pageId = options[optionNumber - 1].getAttribute("data-navigate-to");
		toggleSidebar(true);
		document.querySelector(`[data-page-name="${pageId}"]`).focus();
	}
	// widgets
	else if (eventMelodyMatch("wst", ["w", "s", "enter"])) dom.toggleStopwatch.click(); // [w]idget [s]topwatch [t]oggle
	else if (eventMelodyMatch("wss")) (dom.stopwatchBtnStart.classList.contains("hidden") ? dom.stopwatchBtnStop : dom.stopwatchBtnStart).click(); // [w]idget [s]topwatch [s]tart/stop
	else if (eventMelodyMatch("wsr") && !dom.stopwatchBtnReset.classList.contains("hidden")) dom.stopwatchBtnReset.click(); // [w]idget [s]topwatch [r]eset
	else if (eventMelodyMatch("wtt", ["w", "t", "enter"])) { // [w]idget [t]imer [t]oggle
		let willBeVisible = (dom.toggleTimer.getAttribute("data-state") === "closed");
		dom.toggleTimer.click();
		if (willBeVisible) dom.timerTime.focus();
	}
	else if (eventMelodyMatch("wtf")) dom.timerTime.focus(); // [w]idget [t]imer [f]ocus time
	else if (eventMelodyMatch("wts")) (dom.timerBtnStart.classList.contains("hidden") ? dom.timerBtnStop : dom.timerBtnStart).click(); // [w]idget [t]imer [s]tart/stop
	else if (eventMelodyMatch("wtr") && !dom.timerBtnReset.classList.contains("hidden")) dom.timerBtnReset.click(); // [w]idget [t]imer [r]eset
	else if (eventMelodyMatch("wtm")) dom.timerMute.click(); // [w]idget [t]imer [m]ute/unmute
	else if (eventMelodyMatch("wnt", ["w", "n", "enter"])) { // [w]idget [n]otes [t]oggle
		dom.toggleNotes.click();
		editor?.focus?.();
	}
	else if (/w[stn][12]$/.test(currentMelody.join(""))) { // [w]idget [(s)topwatch/(t)imer/(n)otes] button [(1)/(2)]
		let widget = ({
			"s": dom.stopwatch,
			"t": dom.timer,
			"n": dom.notes,
		})[currentMelody[currentMelody.length - 2]];
		let buttonNumber = parseInt(currentMelody[currentMelody.length - 1]);
		let buttons = widget.querySelectorAll(".widgetButtons button:not(.hidden)");
		buttonNumber = Math.max(1, Math.min(buttonNumber, buttons.length));
		buttons[buttonNumber - 1].click();
		buttons[buttonNumber - 1].focus();
	}
	// nothing :[
	else matchedSomething = false;
	
	if (matchedSomething) {
		currentMelody = [];
	}
});
