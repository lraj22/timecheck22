// helper.js - provides helpful things to other files!

export const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// import all DOM elements by [id]
export var dom = {};
document.querySelectorAll("[id]").forEach(element => dom[element.id] = element);

// fetch context
export var clockdata = {};
function fetchContext () {
	return; // not ready yet!
	
	fetch("./clockdata/chhs-clockdata/context.json")
		.then(res => res.json())
		.then(function (rawContext) {
			// we will use context later on
			clockdata = rawContext;
			
			loaded(); // add a loaded flag
		});
}
fetchContext();

// generic helpers
export function pad0 (string, length) {
	return string.toString().padStart(length, "0");
}

// keeps track of when page is fully loaded
let loadFlags = 0;
export function loaded () {
	var threshold = 2; // waiting for 2 flags: window.onload & context loading
	if (!navigator.onLine) threshold = 1; // just wait for load
	loadFlags++;
	if (loadFlags >= threshold) {
		console.log("finished loading!");
	}
}
