import { dom } from "./helper";

const pageIdsToName = {
	"home": "Home",
	"settings": "Settings",
	"school": "School",
};
let currentPage = null;

function navigateToSidebarPage (page) {
	if (!(page in pageIdsToName)) {
		console.error(`Invalid page '${page}' sent to navigateToSidebarPage.`);
		return;
	}
	
	// switch which one has [id] so that CSS is aware
	document.querySelector("#currentSidebarPage").id = "";
	document.querySelector(`[data-page-name="${page}"]`).id="currentSidebarPage";
	
	dom.sidebarLocation.textContent = pageIdsToName[page]; // change breadcrumbs title
	dom.sbBack.style.visibility = (page !== "home") ? "visible" : "hidden"; // change back button visibility
	currentPage = page.toString(); // change 'currentPage' (w/ duplicate variable)
}

function toggleSidebar (force) {
	let isNowOpen = dom.sidebar.classList.toggle("sidebarVisible", force);
	dom.toggleSidebar.setAttribute("data-icon", isNowOpen ? "left_panel_close" : "left_panel_open")
}

// any element that has [data-navigate-to] attr may be clicked to navigate immediately
document.querySelectorAll("[data-navigate-to]").forEach(el => {
	el.setAttribute("tabindex", "0"); // make tab-focusable
	el.addEventListener("click", function (e) {
		navigateToSidebarPage(e.target.getAttribute("data-navigate-to"));
	});
});

// toggle sidebar
dom.toggleSidebar.addEventListener("click", _ => toggleSidebar());

// back button
dom.sbBack.addEventListener("click", function () {
	let page = currentPage.split("/").slice(0, -1).join("/") || "home"; // go back one layer, or go home
	navigateToSidebarPage(page);
});

// close button
dom.sbClose.addEventListener("click", _ => toggleSidebar(false));

navigateToSidebarPage("home");
