export default {
	"base": "/timecheck22/",
	"build": {
		"rollupOptions": {
			"output": {
				"entryFileNames": "bundle.js",
				"assetFileNames": function (assetInfo) {
					if (assetInfo.name === "index.css") return "bundle.css";
					return assetInfo.name;
				},
			},
		},
	},
};