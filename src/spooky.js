// spooky.js - adds some mischief for the spOooOOoooky season!

import { settings } from "./settings";
import { dom } from "./util";

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
