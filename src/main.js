import "./main.css";

if ("serviceWorker" in navigator) {
	navigator.serviceWorker.register("./sw.js");
}