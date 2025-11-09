import { defineConfig } from "vite";
import { join } from "path";

export default defineConfig({
	"base": "/",
	"build": {
		"rollupOptions": {
			"input": {
				"main": join(import.meta.dirname, "index.html"),
				"contextEditor": join(import.meta.dirname, "context.html"),
			},
			"output": {
				/*
				 * [name] is based off of either
				 *   build.rollupOptions.input labels (like main.js) or
				 *   original file names (for chunk files like settings.js)
				 */
				"entryFileNames": "[name].js", // main files like main.js
				"chunkFileNames": "shared/[name].js", // chunk files like settings.js that are shared
				"assetFileNames": "[name].[ext]", // assets like css
			},
		},
	},
});
