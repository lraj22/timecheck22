// context.js - manages operations in context.html

import "./context.css";
import "./settings";
import React, { StrictMode } from "react"; // 'import React' is necessary for some reason (preventing errors in console)
import { createRoot } from "react-dom/client";
import ContextEditorApp from "./components/ContextEditorApp";

const root = createRoot(document.getElementById("app"));
root.render((
	<StrictMode>
		<ContextEditorApp />
	</StrictMode>
)); // load basically the entire app
