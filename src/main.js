import { loaded, months, pad0 } from "./helper";
import "./main.css";

// import all DOM elements by [id]
var dom = {};
document.querySelectorAll("[id]").forEach(element => dom[element.id] = element);

// this function runs all the time
function tick () {
	let now = new Date();
	
	// update clock
	dom.time.textContent = "" + ((now.getHours() % 12) || 12) + ":" + pad0(now.getMinutes(), 2);
	dom.date.textContent = "" + months[now.getMonth()] + " " + now.getDate() + ", " + now.getFullYear();
	
	// request next tick
	requestAnimationFrame(tick);
}

requestAnimationFrame(tick);

// on page load
window.addEventListener("load", () => loaded());

// set up sw.js if supported
if ("serviceWorker" in navigator) {
	navigator.serviceWorker.register("./sw.js");
}
