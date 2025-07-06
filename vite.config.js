export default {
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