import { audioStopReset } from "./audio";
import { dom, msToTimeDiff } from "./helper";

export var stopwatchData = {
	"total": 0,
};
export var timerData = {
	"from": 10 * 60 * 1000,
	"total": 10 * 60 * 1000,
	"isMuted": false,
};

function timeDiffToMs (timeDiff) {
	var multipliers = [1e3, 60e3, 3600e3, 24 * 3600e3];
	var parts = timeDiff.replace(/[^\d:.]/g, "").split(":").reverse().map(function (part, i) {
		if (i) part = part.replaceAll(".", "");
		let dotIndex = part.indexOf(".");
		if (dotIndex !== -1) part = part.slice(0, dotIndex) + "." + part.slice(dotIndex).replaceAll(".", "");
		return parseFloat(part || "0") || 0;
	});
	return parts.reduce(function (acc, curr, i) {
		return acc + (curr * (multipliers[i] || 0));
	}, 0);
}

// stopwatch
dom.toggleStopwatch.addEventListener("click", function () {
	let isOpen = dom.toggleStopwatch.classList.toggle("btnActive");
	dom.toggleStopwatch.title = (isOpen ? "Close" : "Open") + " stopwatch";
	dom.stopwatch.classList.toggle("hidden");
});

dom.stopwatchBtnPlay.addEventListener("click", function () {
	stopwatchData.startTime = performance.now();
	stopwatchData.running = true;
	dom.stopwatchBtnPlay.classList.toggle("hidden", true);
	dom.stopwatchBtnPause.classList.toggle("hidden", false);
	dom.stopwatchBtnRestart.classList.toggle("hidden", false);
	dom.stopwatchBtnPause.focus();
});

dom.stopwatchBtnPause.addEventListener("click", function () {
	stopwatchData.total += performance.now() - stopwatchData.startTime;
	stopwatchData.running = false;
	dom.stopwatchBtnPause.classList.toggle("hidden", true);
	dom.stopwatchBtnPlay.classList.toggle("hidden", false);
	dom.stopwatchBtnPlay.focus();
});

dom.stopwatchBtnRestart.addEventListener("click", function () {
	stopwatchData.total = 0;
	stopwatchData.running = false;
	dom.stopwatchTime.textContent = "0.00";
	dom.stopwatchBtnPlay.classList.toggle("hidden", false);
	dom.stopwatchBtnPause.classList.toggle("hidden", true);
	dom.stopwatchBtnRestart.classList.toggle("hidden", true);
	dom.stopwatchBtnPlay.focus();
});

// timer
dom.toggleTimer.addEventListener("click", function () {
	let isOpen = dom.toggleTimer.classList.toggle("btnActive");
	dom.toggleTimer.title = (isOpen ? "Close" : "Open") + " timer";
	dom.timer.classList.toggle("hidden");
});

dom.timerBtnPlay.addEventListener("click", function () {
	timerData.startTime = performance.now();
	timerData.running = true;
	dom.timerTime.disabled = true;
	dom.timerBtnPlay.classList.toggle("hidden", true);
	dom.timerBtnPause.classList.toggle("hidden", false);
	dom.timerBtnRestart.classList.toggle("hidden", false);
	dom.timerBtnPause.focus();
});

dom.timerBtnPause.addEventListener("click", function () {
	timerData.total -= performance.now() - timerData.startTime;
	timerData.running = false;
	dom.timerTime.disabled = false;
	dom.timerBtnPause.classList.toggle("hidden", true);
	dom.timerBtnPlay.classList.toggle("hidden", false);
	dom.timerBtnPlay.focus();
});

dom.timerBtnRestart.addEventListener("click", function () {
	timerData.total = timerData.from;
	timerData.running = false;
	dom.timerTime.value = msToTimeDiff(timerData.from).replace("s", "");
	dom.timerTime.disabled = false;
	audioStopReset("timerRing");
	dom.timerBtnPlay.classList.toggle("hidden", false);
	dom.timerBtnPause.classList.toggle("hidden", true);
	dom.timerBtnRestart.classList.toggle("hidden", true);
	dom.timerBtnPlay.focus();
});

dom.timerTime.addEventListener("input", function () {
	if (timerData.running) return;
	if (timerData.total === 0) {
		dom.timerBtnPlay.classList.toggle("hidden", false);
		dom.timerBtnPause.classList.toggle("hidden", true);
		dom.timerBtnRestart.classList.toggle("hidden", true);
		audioStopReset("timerRing");
	}
	timerData.from = timerData.total = timeDiffToMs(dom.timerTime.value);
});

dom.timerMute.addEventListener("click", function () {
	var isMuted = !timerData.isMuted;
	timerData.isMuted = isMuted;
	dom.timerMute.textContent = isMuted ? "volume_off" : "volume_up";
	dom.timerMute.title = isMuted ? "Click to unmute the timer" : "Click to mute the timer";
	if (isMuted) audioStopReset("timerRing");
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

resizer.observe(dom.stopwatch);
resizer.observe(dom.timer);
adjustFontSize(dom.stopwatchTime);
adjustFontSize(dom.timerTime);

makeDraggable(dom.stopwatch, dom.stopwatchDrag);
makeDraggable(dom.timer, dom.timerDrag);

// stopwatch & timer
function makeDraggable(element, dragger) {
	function mousemoveDrag (e) {
		e.preventDefault();
		posX1 = mouseX - e.clientX;
		posY1 = mouseY - e.clientY;
		mouseX = e.clientX;
		mouseY = e.clientY;
		element.style.top = (element.offsetTop - posY1) + "px";
		element.style.left = (element.offsetLeft - posX1) + "px";
	}
	
	var posX1 = 0, posY1 = 0, mouseX = 0, mouseY = 0;
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
	
	// TODO: fix touch events not working
	dragger.addEventListener("touchstart", function (ev) {
		document.body.classList.add("dragging");
		dragger.addEventListener("touchmove", ontouchmove, {
			"passive": false,
		});
		dragger.addEventListener("touchend", ontouchend);
		dragger.addEventListener("touchcancel", ontouchend);
	
		function ontouchmove (e) {
			e.preventDefault();
			let total = e.targetTouches.length;
			for (let i = 0; i < total; i++) {
				let target = e.targetTouches[i];
				var x = target.clientX - dragger.clientWidth/2 + "px";
				var y = target.clientY - dragger.clientHeight/2 + "px";
				element.style.left = x;
				element.style.top = y;
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

function adjustFontSize (textElement) {
	const position = textElement.parentElement.getBoundingClientRect();
	const newFontSize = Math.min(position.width, position.height) * 0.225; // magic number (scale size)
	textElement.style.fontSize = newFontSize + "px";
}
