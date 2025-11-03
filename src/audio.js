// audio.js - audio manager

var audios = {};
var types = {
	"timerRing": "timerEndHarp",
};
let currentlyPlaying = [];
function loadAudios () {
	var audioBase = "./audio/";
	var audioList = {
		"silent": {
			"slug": "silent.mp3",
			"loop": true,
		},
		"timerEndHarp": {
			"slug": "timer-end-harp.mp3",
			"loop": true,
		},
		"timerEndQuick": {
			"slug": "timer-end-quick.mp3",
			"loop": true,
		},
	};
	Object.keys(audioList).forEach(function (audioId) {
		var audio = audioList[audioId];
		var audioEl = new Audio(audioBase + audio.slug);
		if ("loop" in audio) audioEl.loop = audio.loop;
		audios[audioId] = audioEl;
	});
}
loadAudios();

function play (type) {
	let audioKey = types[type];
	if (!audioKey) return;
	audios[audioKey].play();
	currentlyPlaying.push(type);
}

function setVolume (type, volume) {
	let audioKey = types[type];
	if (!audioKey) return;
	audios[audioKey].volume = volume;
}

function switchTo (type, newValue) {
	let audioKey = types[type];
	if (!audioKey) return;
	let prevVolume = audios[audioKey].volume;
	stopReset(type);
	setVolume(type, 1);
	types[type] = newValue;
	play(type);
	setVolume(type, prevVolume);
}

function stopReset (type) {
	let audioKey = types[type];
	if (!audioKey) return;
	audios[audioKey].pause();
	audios[audioKey].currentTime = 0;
	currentlyPlaying.splice(currentlyPlaying.indexOf(type), 1);
}

export default {
	types,
	currentlyPlaying,
	play,
	setVolume,
	switchTo,
	stopReset,
};
