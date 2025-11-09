// context.js - manages operations in context.html

import "./context.css";
import "./settings";
import React from "react"; // necessary for some reason (preventing errors in console)
import { createRoot } from "react-dom/client";
import ContextEditorApp from "./components/ContextEditorApp";

const root = createRoot(document.getElementById("app"));
root.render(<ContextEditorApp />); // load basically the entire app
