import { defineConfig } from 'vite';

export default defineConfig({
	"base": "/timecheck22/",
	"build": {
		"rollupOptions": {
			"output": {
				"entryFileNames": function (entryInfo) {
					// console.log("entry", entryInfo);
					return "bundle.js";
				},
				"assetFileNames": function (assetInfo) {
					// console.error("asset", assetInfo, assetInfo.name, assetInfo.originalFileName);
					if (assetInfo.name === "index.css") return "bundle.css";
					return assetInfo.name;
				},
			},
		},
		// "cssCodeSplit": true,
	},
	// "plugins": [injectCssAsStyleTag()],
});


// note for the future:
// the below code is not in use
// it was supposed to take internal.css and put it in a <style> tag inside the <head> of index.html, but I couldn't get it to work.
// so I just left it here
// for now, `npx vite build` does not work locally (error due to style tag), but it seems to work on GH Actions for some reason
// hopefully one day I figure out why <style></style> doesn't work in Vite and why I can't make it somehow work (I want those styles to load regardless of if anything else loads)
// thanks @gentoo90 (https://github.com/vitejs/vite/issues/18062#issuecomment-2623201644) for the code but it doesn't work yet :[

function escapeRegex(string) {
	return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

function injectCssAsStyleTag() {
	return {
		name: 'inject-css-as-style-tags',
		apply: 'build',
		transformIndexHtml: {
			order: 'post',
			handler: (html, ctx) => {
				const tags = [];
				const bundle = ctx.bundle;
				if (bundle == null) {
					return [];
				}
				
				console.log(bundle);
				
				Object.values(bundle)
					.filter((output) => output.fileName.endsWith('.css'))
					.forEach((output) => {
						console.log("ONE");
						if (output.type === 'asset' && typeof output.source === 'string') {
							console.log("TWO");
							tags.push({
								tag: 'style',
								children: output.source,
								injectTo: 'head',
							});
							const fileNameRegExp = RegExp(
								`<link.*href=".*${escapeRegex(output.fileName)}".*\\/?>`,
								'gmi',
							);
							html = html.replaceAll(fileNameRegExp, '');
						}
					});

				return { html, tags };
			},
		},
	};
}
