// audio.js - audio manager

var audios = {};
var audioTypes = {
	"timerRing": "timerEndHarp",
};
var audiosCurrentlyPlaying = [];
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

export function audioPlay (type) {
	let audioKey = audioTypes[type];
	if (!audioKey) return;
	audios[audioKey].play();
	audiosCurrentlyPlaying.push(type);
}

export function setAudioVolume (type, volume) {
	let audioKey = audioTypes[type];
	if (!audioKey) return;
	audios[audioKey].volume = volume;
}

export function audioSwitch (type, newValue) {
	let audioKey = audioTypes[type];
	if (!audioKey) return;
	let prevVolume = audios[audioKey].volume;
	audioStopReset(type);
	setAudioVolume(type, 1);
	audioTypes[type] = newValue;
	audioPlay(type);
	setAudioVolume(type, prevVolume);
}

export function audioStopReset (type) {
	let audioKey = audioTypes[type];
	if (!audioKey) return;
	audios[audioKey].pause();
	audios[audioKey].currentTime = 0;
	audiosCurrentlyPlaying.splice(audiosCurrentlyPlaying.indexOf(type), 1);
}
