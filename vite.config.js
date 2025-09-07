import { defineConfig } from "vite";

export default defineConfig({
	"base": "/timecheck22/",
	"build": {
		"rollupOptions": {
			"output": {
				"entryFileNames": "bundle.js",
				"assetFileNames": function (assetInfo) {
					if (assetInfo.names[0] === "index.css") return "bundle.css";
					return assetInfo.names[0];
				},
			},
		},
	},
});
