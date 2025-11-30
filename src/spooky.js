// spooky.js - adds some mischief for the spOooOOoooky season!

import { settings, updateSettings } from "./settings";
import { dom } from "./util";

const removalTimestamp = 1765065600000; // first millisecond of Dec 7, 2025 UTC
const now = Date.now(); // current time

if (settings.backgroundTheme === "spooky") {
	if (now > removalTimestamp) {
		// spooky's been removed; switch their theme to dark, the default theme
		settings.backgroundTheme = "dark";
		updateSettings(false);
	} else {
		// spooky's going to be removed; show them a popup
		let popup = document.createElement("div");
		popup.innerHTML = `<p><b>Spooky theme is disappearing!</b></p><p>Spooky theme will be removed soon, because Halloween's passed and Christmas is coming. If you enjoy seasonal themes, you might like our Winter theme! Regardless, this theme will be removed entirely in the coming days. I suggest switching themes right now so you don't get caught off guard when it happens. Click this popup to close it.</p>`;
		
		popup.style.cssText = `width: 600px; max-width: 80vw; position: fixed; top: 1rem; left: 1rem; border: 1px solid white; padding: 1rem; background-color: black; color: white`;
		
		popup.onclick = _ => popup.remove();
		
		document.body.appendChild(popup);
	}
}

if (now > removalTimestamp) {
	// once spooky is removed, you cannot select it
	let spookyOpt = document.querySelector(`#settingBackgroundTheme option[value="spooky"]`);
	if (spookyOpt) spookyOpt.remove();
} else {
	// aka, if not yet removed
	document.querySelectorAll(`[data-js-on-click="true"]`).forEach(el => {
		el.addEventListener("click", _ => {
			if (settings.backgroundTheme !== "spooky") return; // only jumpscare on spooky theme
			
			let jumpscare = dom.jumpscare;
			jumpscare.currentTime = 0;
			jumpscare.style.display = "block";
			jumpscare.play();
			
			let scream = document.getElementById("scream");
			scream.play();
			document.body.classList.add("cursor-prohibit");
			
			scream.onended = _ => {
				document.body.classList.remove("cursor-prohibit");
				jumpscare.onclick = _ => {
					jumpscare.style.display = "none";
					jumpscare.onclick = null;
				};
			};
		});
	});
}
