// helper.js - provides helpful things to other files!

export const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// import all DOM elements by [id]
export var dom = {};
document.querySelectorAll("[id]").forEach(element => dom[element.id] = element);

// generic helpers
export function pad0 (string, length) {
	return string.toString().padStart(length, "0");
}

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
