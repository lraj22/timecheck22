import audio from "./audio";
import { dom, doOnLoad, msToTimeDiff, state, updateState } from "./util";

const timePartMultipliers = [1e3, 60e3, 3600e3, 24 * 3600e3];
export var stopwatchData = {
	"total": state.widgets.stopwatch.total || 0,
};
dom.stopwatchTime.textContent = timeDiffToMsInverse(stopwatchData.total, 2);
if (state.widgets.stopwatch.total) {
	dom.stopwatchBtnPause.classList.toggle("hidden", true);
	dom.stopwatchBtnPlay.classList.toggle("hidden", false);
	dom.stopwatchBtnRestart.classList.toggle("hidden", false);
}
export var timerData = {
	"from": 10 * 60 * 1000,
	"total": state.widgets.timer.timeRemaining || 10 * 60 * 1000,
	"isMuted": false,
};
dom.timerTime.value = timeDiffToMsInverse(timerData.total);
if (state.widgets.timer.timeRemaining) {
	dom.timerTime.disabled = false;
	dom.timerBtnPause.classList.toggle("hidden", true);
	dom.timerBtnPlay.classList.toggle("hidden", false);
	dom.timerBtnRestart.classList.toggle("hidden", false);
}

function timeDiffToMs (timeDiff) {
	var parts = timeDiff.replace(/[^\d:.]/g, "").split(":").reverse().map(function (part, i) {
		if (i) part = part.replaceAll(".", "");
		let dotIndex = part.indexOf(".");
		if (dotIndex !== -1) part = part.slice(0, dotIndex) + "." + part.slice(dotIndex).replaceAll(".", "");
		return parseFloat(part || "0") || 0;
	});
	return parts.reduce(function (acc, curr, i) {
		return acc + (curr * (timePartMultipliers[i] || 0));
	}, 0);
}

function timeDiffToMsInverse (ms, precision) {
	let parts = [];
	ms = Math.abs(ms);
	if (typeof precision !== "number") {
		if (ms === 0) precision = 0;
		else if (ms < 1e3) precision = 3;
		else if (ms < 5e3) precision = 2;
		else if (ms < 10e3) precision = 1;
		else precision = 0;
	}
	let loss = 3 - Math.max(0, Math.min(precision, 3));
	ms = Math.floor(ms / (10 ** loss)) * (10 ** loss);
	
	let forceAllNext = false;
	for (let i = 0; i < timePartMultipliers.length; i++) {
		let multiplier = timePartMultipliers[timePartMultipliers.length - i - 1];
		let amount = Math.floor(ms / multiplier);
		if ((amount === 0) && (!forceAllNext)) continue;
		
		ms -= multiplier * amount;
		amount = amount.toString().padStart(forceAllNext ? 2 : 1, "0");
		if ((multiplier === 1e3) && ms) {
			amount = amount + "." + Math.round(ms / (10 ** loss));
		}
		parts.push(amount);
		forceAllNext = true;
	}
	if (parts.length === 0) parts = ["0"];
	return parts.join(":");
}

function useNewTimerTime (updateFrom) {
	if (timerData.running) return;
	if (timerData.total === 0) {
		dom.timerBtnPlay.classList.toggle("hidden", false);
		dom.timerBtnPause.classList.toggle("hidden", true);
		dom.timerBtnRestart.classList.toggle("hidden", true);
		audio.stopReset("timerRing");
	}
	timerData.total = timeDiffToMs(dom.timerTime.value);
	if (updateFrom) timerData.from = timerData.total;
}
useNewTimerTime(false);

const togglers = {
	"stopwatch": function (source) {
		let isOpen = (dom.toggleStopwatch.getAttribute("data-state") === "open");
		dom.toggleStopwatch.textContent = (isOpen ? "Open" : "Close") + " stopwatch";
		dom.toggleStopwatch.setAttribute("data-state", isOpen ? "closed" : "open");
		dom.stopwatch.classList.toggle("v-hidden");
		
		umami.track("stopwatch-toggled", {
			"newState": isOpen ? "closed" : "open",
			"source": source,
		});
	},
	"timer": function (source) {
		let isOpen = (dom.toggleTimer.getAttribute("data-state") === "open");
		dom.toggleTimer.textContent = (isOpen ? "Open" : "Close") + " timer";
		dom.toggleTimer.setAttribute("data-state", isOpen ? "closed" : "open");
		dom.timer.classList.toggle("v-hidden");
		
		umami.track("timer-toggled", {
			"newState": isOpen ? "closed" : "open",
			"source": source,
		});
	},
	"notes": function (source) {
		let isOpen = (dom.toggleNotes.getAttribute("data-state") === "open");
		dom.toggleNotes.textContent = (isOpen ? "Open" : "Close") + " notes";
		dom.toggleNotes.setAttribute("data-state", isOpen ? "closed" : "open");
		dom.notes.classList.toggle("v-hidden");
		
		setUpQuill(); // only happens once due to a safety check in function
		
		umami.track("notes-toggled", {
			"newState": isOpen ? "closed" : "open",
			"source": source,
		});
	},
};

// stopwatch
dom.toggleStopwatch.addEventListener("click", _ => togglers.stopwatch("widgetMenu"));

dom.stopwatchBtnPlay.addEventListener("click", function () {
	stopwatchData.startTime = performance.now();
	stopwatchData.running = true;
	dom.stopwatchBtnPlay.classList.toggle("hidden", true);
	dom.stopwatchBtnPause.classList.toggle("hidden", false);
	dom.stopwatchBtnRestart.classList.toggle("hidden", false);
	dom.stopwatchBtnPause.focus();
	
	umami.track("stopwatch-used", {
		"event": "play",
		"currentTime": timeDiffToMsInverse(stopwatchData.total, 2),
	});
});

dom.stopwatchBtnPause.addEventListener("click", function () {
	stopwatchData.total += performance.now() - stopwatchData.startTime;
	stopwatchData.running = false;
	state.widgets.stopwatch.total = stopwatchData.total;
	updateState();
	dom.stopwatchBtnPause.classList.toggle("hidden", true);
	dom.stopwatchBtnPlay.classList.toggle("hidden", false);
	dom.stopwatchBtnPlay.focus();
	
	umami.track("stopwatch-used", {
		"event": "pause",
		"currentTime": timeDiffToMsInverse(stopwatchData.total, 2),
	});
});

dom.stopwatchBtnRestart.addEventListener("click", function () {
	stopwatchData.total = 0;
	stopwatchData.running = false;
	state.widgets.stopwatch.total = 0;
	updateState();
	dom.stopwatchTime.textContent = "0.00";
	dom.stopwatchBtnPlay.classList.toggle("hidden", false);
	dom.stopwatchBtnPause.classList.toggle("hidden", true);
	dom.stopwatchBtnRestart.classList.toggle("hidden", true);
	dom.stopwatchBtnPlay.focus();
	
	umami.track("stopwatch-used", {
		"event": "restart",
		"currentTime": timeDiffToMsInverse(stopwatchData.total, 2),
	});
});

// timer
dom.toggleTimer.addEventListener("click", _ => togglers.timer("widgetMenu"));

dom.timerBtnPlay.addEventListener("click", function () {
	timerData.startTime = performance.now();
	timerData.running = true;
	dom.timerTime.disabled = true;
	dom.timerBtnPlay.classList.toggle("hidden", true);
	dom.timerBtnPause.classList.toggle("hidden", false);
	dom.timerBtnRestart.classList.toggle("hidden", false);
	dom.timerBtnPause.focus();
	
	umami.track("timer-used", {
		"event": "play",
		"currentTime": timeDiffToMsInverse(timerData.total),
	});
});

dom.timerBtnPause.addEventListener("click", function () {
	timerData.total -= performance.now() - timerData.startTime;
	state.widgets.timer.timeRemaining = timerData.total;
	updateState();
	timerData.running = false;
	dom.timerTime.disabled = false;
	dom.timerBtnPause.classList.toggle("hidden", true);
	dom.timerBtnPlay.classList.toggle("hidden", false);
	dom.timerBtnPlay.focus();
	
	umami.track("timer-used", {
		"event": "pause",
		"currentTime": timeDiffToMsInverse(timerData.total),
	});
});

dom.timerBtnRestart.addEventListener("click", function () {
	timerData.total = timerData.from;
	timerData.running = false;
	state.widgets.timer.timeRemaining = 0;
	updateState();
	dom.timerTime.value = msToTimeDiff(timerData.from).replace("s", "");
	dom.timerTime.disabled = false;
	audio.stopReset("timerRing");
	dom.timerBtnPlay.classList.toggle("hidden", false);
	dom.timerBtnPause.classList.toggle("hidden", true);
	dom.timerBtnRestart.classList.toggle("hidden", true);
	dom.timerBtnPlay.focus();
	
	umami.track("timer-restart", {
		"event": "restart",
		"currentTime": timeDiffToMsInverse(timerData.total),
	});
});

dom.timerTime.addEventListener("input", _ => useNewTimerTime(true));

dom.timerMute.addEventListener("click", function () {
	var isMuted = !timerData.isMuted;
	timerData.isMuted = isMuted;
	dom.timerMute.textContent = isMuted ? "volume_off" : "volume_up";
	dom.timerMute.title = isMuted ? "Click to unmute the timer" : "Click to mute the timer";
	if (isMuted) audio.stopReset("timerRing");
	
	umami.track("timer-used", {
		"event": isMuted ? "mute" : "unmute",
		"running": timerData.running,
	});
});

// activate stopwatch & dom.timer
var resizer = new ResizeObserver(function (entries) {
	entries.forEach(function (entry) {
		let displayId = entry.target.id + "Time";
		if (window[displayId]) {
			adjustFontSize(window[displayId]);
		}
	});
});

// stopwatch & timer
resizer.observe(dom.stopwatch);
resizer.observe(dom.timer);
adjustFontSize(dom.stopwatchTime);
adjustFontSize(dom.timerTime);

// notes
const openingLines = [
	"Type away, write your heart out.",
	"Feeling inspired?",
	"To write is to create meaning.",
	"How's your day been?",
	"Today's a great day to be kind.",
	"A blank page is filled with opportunity.",
];
dom.toggleNotes.addEventListener("click", _ => togglers.notes("widgetMenu"));

let notesOpened = false;
let Quill = null;
let editor = null;
let lastChanged = null;
async function setUpQuill () {
	if (notesOpened) return;
	notesOpened = true;
	
	// only import quill when needed
	Quill = (await import("quill")).default;
	await import("quill/dist/quill.core.css");
	await import("quill/dist/quill.snow.css");
	editor = new Quill(dom.notesEditor, {
		modules: {
			toolbar: [
				[
					"bold",
					"italic",
					"underline",
					"strike",
				],
				// [
				// 	"blockquote",
				// 	"code-block",
				// ],
				[
					"link",
					// "image",
					// "video",
					// "formula",
				],
				// [
				// 	{ "list": "ordered"},
				// 	{ "list": "bullet" },
				// 	{ "list": "check" },
				// ],
				// [
				// 	{ "script": "sub"},
				// 	{ "script": "super" },
				// ],
				// [
				// 	{ "indent": "-1"},
				// 	{ "indent": "+1" },
				// ],
				[
					{ "size": ["small", false, "large", "huge"] },
				],
				// [
				// 	{ "header": [1, 2, 3, 4, 5, 6, false] },
				// ],
				[
					{ "color": [] },
					{ "background": [] },
				],
				// [
				// 	{ "font": [] },
				// ],
				[
					{ "align": [] },
				],
				[
					"clean",
				],
			],
		},
		placeholder: openingLines[Math.floor(openingLines.length * Math.random())],
		theme: "snow",
	});
	if (state.widgets.notes.content) {
		editor.setContents(state.widgets.notes.content);
	}
	editor.on("text-change", async _ => {
		dom.notesStatus.textContent = "* Saving changes...";
		lastChanged = Date.now();
	});
}

// updates
function saveWidgetStates () {
	let perfNow = performance.now();
	state.widgets.stopwatch.total = stopwatchData.total + (stopwatchData.running ? (perfNow - stopwatchData.startTime) : 0);
	state.widgets.timer.timeRemaining = timerData.total - (timerData.running ? (perfNow - timerData.startTime) : 0);
	
	if (editor && ((lastChanged + 500) < Date.now())) {
		lastChanged = null;
		state.widgets.notes.content = editor.getContents().ops;
		dom.notesStatus.textContent = "Changes saved.";
		
		umami.track("notes-updated", {
			"length": editor.getLength(),
		});
	}
	updateState();
}
setInterval(saveWidgetStates, 2000);

// all widgets
const widgets = [dom.stopwatch, dom.timer, dom.notes];
widgets.forEach(widget => {
	makeDraggable(widget, dom[widget.id + "Drag"]);
	makeResizableDiv(widget);
	widget.querySelector(".closer").addEventListener("click", _ => {
		togglers[widget.id]("closeBtn");
	});
});

function makeDraggable(element, dragger) {
	function mousemoveDrag (e) {
		if ("preventDefault" in e) e.preventDefault();
		posX1 = mouseX - e.clientX;
		posY1 = mouseY - e.clientY;
		mouseX = e.clientX;
		mouseY = e.clientY;
		element.style.top = (element.offsetTop - posY1) + "px";
		element.style.left = (element.offsetLeft - posX1) + "px";
	}
	
	var posX1, posY1, mouseX, mouseY;
	doOnLoad(_ => {
		let boundingRect = element.getBoundingClientRect();
		posX1 = 0, posY1 = 0, mouseX = boundingRect.x, mouseY = boundingRect.y;
		mousemoveDrag({
			"clientX": mouseX,
			"clientY": mouseY,
		});
	});
	dragger.addEventListener("mousedown", function (e) {
		e.preventDefault();
		document.body.classList.add("dragging");
		mouseX = e.clientX;
		mouseY = e.clientY;
		document.onmouseup = function () {
			document.body.classList.remove("dragging");
			document.onmouseup = null;
			document.onmousemove = null;
		};
		document.onmousemove = mousemoveDrag;
	});
	
	dragger.addEventListener("touchstart", function (ev) {
		document.body.classList.add("dragging");
		dragger.addEventListener("touchmove", ontouchmove, {
			"passive": false,
		});
		dragger.addEventListener("touchend", ontouchend);
		dragger.addEventListener("touchcancel", ontouchend);
		if (ev.targetTouches[0]) {
			mouseX = ev.targetTouches[0].clientX;
			mouseY = ev.targetTouches[0].clientY;
		}
	
		function ontouchmove (e) {
			e.preventDefault();
			let total = e.targetTouches.length;
			for (let i = 0; i < total; i++) {
				let target = e.targetTouches[i];
				mousemoveDrag(target);
			}
		}
		
		function ontouchend () {
			document.body.classList.remove("dragging");
			dragger.removeEventListener("touchmove", ontouchmove);
			dragger.removeEventListener("touchend", ontouchend);
			dragger.removeEventListener("touchcancel", ontouchend);
		}
	
	});
}

function makeResizableDiv (element) {
	if (!element) return;
	const resizer = element.querySelector(".resizer");
	if (!resizer) return;
	
	function mousemoveDrag (e) {
		if (typeof e.preventDefault === "function") e.preventDefault();
		
		let newWidth = e.pageX - element.getBoundingClientRect().left;
		let newHeight = e.pageY - element.getBoundingClientRect().top;
		newWidth = Math.max(minWidth, newWidth);
		newHeight = Math.max(minHeight, newHeight);
		element.style.width = newWidth + "px";
		element.style.height = newHeight + "px";
	}
	
	const minWidth = parseFloat(getComputedStyle(element).minWidth);
	const minHeight = parseFloat(getComputedStyle(element).minHeight);
	resizer.addEventListener("mousedown", e => {
		e.preventDefault();
		function mousemoveUp () {
			window.removeEventListener("mouseup", mousemoveUp);
			window.removeEventListener("mousemove", mousemoveDrag);
		}
		window.addEventListener("mouseup", mousemoveUp);
		window.addEventListener("mousemove", mousemoveDrag);
	});
	
	resizer.addEventListener("touchstart", _ => {
		document.body.classList.add("dragging");
		resizer.addEventListener("touchmove", ontouchmove, {
			"passive": false,
		});
		resizer.addEventListener("touchend", ontouchend);
		resizer.addEventListener("touchcancel", ontouchend);
	
		function ontouchmove (e) {
			e.preventDefault();
			let total = e.targetTouches.length;
			for (let i = 0; i < total; i++) {
				let target = e.targetTouches[i];
				mousemoveDrag(target);
			}
		}
		
		function ontouchend () {
			document.body.classList.remove("dragging");
			resizer.removeEventListener("touchmove", ontouchmove);
			resizer.removeEventListener("touchend", ontouchend);
			resizer.removeEventListener("touchcancel", ontouchend);
		}
	
	});
}

function adjustFontSize (textElement) {
	const position = textElement.parentElement.getBoundingClientRect();
	const newFontSize = Math.min(position.width, position.height) * 0.225; // magic number (scale size)
	textElement.style.fontSize = newFontSize + "px";
}
