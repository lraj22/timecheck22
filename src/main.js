import { loaded, months, dom, pad0, clockdata } from "./helper";
import "./sidebar";
import "./main.css";

// this function runs all the time
function tick () {
	let now = new Date();
	
	// update clock
	dom.time.textContent = "" + ((now.getHours() % 12) || 12) + ":" + pad0(now.getMinutes(), 2);
	dom.date.textContent = "" + months[now.getMonth()] + " " + now.getDate() + ", " + now.getFullYear();
	
	// if clockdata has loaded
	if ("version" in clockdata) {
		dom.statusMiddle.textContent = (window.innerWidth > 500) ? clockdata.metadata.school : clockdata.metadata.shortName;
	}
	
	// request next tick
	requestAnimationFrame(tick);
}

requestAnimationFrame(tick);

// on page load
window.addEventListener("load", () => loaded());
dom.toggleSidebar.click();

// set up sw.js if supported
if ("serviceWorker" in navigator) {
	navigator.serviceWorker.register("./sw.js");
}
