// experiments.js - contains various utilities available in the experiments tab

import { logVisible, state, updateState } from "./util";
export const experimentsModules = import.meta.glob("./experiments/*.js");

export function getExperimentData (id) {
	return (state.experiments?.find(experiment => experiment.id === id)?.data) || {};
}

export function setExperimentDataKey (id, key, value) {
	if (!Array.isArray(state.experiments)) state.experiments = [];
	
	if (state.experiments.find(experiment => experiment.id === id)) {
		state.experiments = state.experiments.map(experiment => {
			let newData = (typeof experiment?.data !== "object") ? {} : experiment.data;
			newData[key] = value;
			return (experiment.id === id) ? {
				...experiment,
				"data": newData,
			} : experiment;
		});
	} else {
		console.warn(`Experiment ${id} not found, could not set data`, key, value);
	}
	
	updateState();
}

function setExperimentEnabled (id, enabled, data) {
	if (!Array.isArray(state.experiments)) state.experiments = [];
	
	if (state.experiments.find(experiment => experiment.id === id)) {
		state.experiments = state.experiments.map(experiment => {
			return (experiment.id === id) ? {
				...experiment,
				"enabled": enabled,
			} : experiment;
		});
	} else {
		state.experiments.push({
			"id": id,
			"enabled": enabled,
			"data": (typeof data === "undefined") ? {} : data,
		});
	}
	
	updateState();
}

function externalExperimentFunction (experimentId, functionName) {
	return async function () {
		if (!(experimentId in loadedExperiments)) {
			let experimentPath = Object.keys(experimentsModules).find(modulePath => modulePath.includes(experimentId + ".js"));
			loadedExperiments[experimentId] = await experimentsModules[experimentPath]();
		}
		loadedExperiments[experimentId]?.[functionName]?.();
	};
}
const loadedExperiments = {};
const experiments = {
	// Just a test experiment to ensure the experiments tab/API is functioning as intended!
	"2026-01-15-test": {
		"init": function () {
			let data = getExperimentData("2026-01-15-test");
			logVisible(data.message || "test experiment has initialized!");
		},
		"reload": function () {
			// This custom reload knows that the cleanup is not necessary when the data has changed, so it only inits, avoiding the extra cleanup step. Smart! This is the purpose of the custom reload function.
			experiments["2026-01-15-test"].init();
		},
		"cleanup": function () {
			logVisible("test experiment has cleaned up!");
		},
	},
	
	// PiP (Picture in Picture) experiment to allow users to pop out time/timeLeft/timeOver/etc. to a PiP window
	"2026-01-15-pip": {
		"init": externalExperimentFunction("2026-01-15-pip", "init"),
		"cleanup": externalExperimentFunction("2026-01-15-pip", "cleanup"),
	},
};
const experimentsList = Object.keys(experiments);

// notice: experiments not in the current state.experiments are by default OFF/DISABLED
state.experiments = state.experiments.filter(experiment => experimentsList.includes(experiment?.id));
updateState();

document.querySelectorAll("[data-experiment-id]").forEach(experimentInput => {
	const experimentId = experimentInput.getAttribute("data-experiment-id");
	const currentState = state.experiments.find(experiment => experiment.id === experimentId)?.enabled;
	if (currentState !== undefined) experimentInput.checked = currentState;
	experimentInput.addEventListener("change", _ => {
		const newState = experimentInput.checked;
		setExperimentEnabled(experimentId, newState);
		if (newState === true) {
			experiments[experimentId]?.init?.();
		} else {
			experiments[experimentId]?.cleanup?.();
		}
	});
});

document.querySelectorAll("[data-experiment-data-key]").forEach(dataInput => {
	const experimentId = dataInput.getAttribute("data-associated-experiment-id");
	const dataKey = dataInput.getAttribute("data-experiment-data-key");
	const isCheckbox = (dataInput.type === "checkbox");
	
	// load current value
	const currentValue = state.experiments.find(experiment => experiment.id === experimentId)?.data?.[dataKey];
	if (currentValue !== undefined) {
		if (isCheckbox) dataInput.checked = currentValue;
		else dataInput.value = currentValue;
	}
	
	dataInput.addEventListener("change", _ => {
		// update saved value
		const newValue = isCheckbox ? dataInput.checked : dataInput.value;
		setExperimentDataKey(experimentId, dataKey, newValue);
		
		// reload experiment with new data (if enabled)
		if (state.experiments.find(experiment => experiment.id === experimentId)?.enabled !== true) return;
		if (typeof experiments[experimentId]?.reload === "function") experiments[experimentId].reload(); // use dedicated reload if available
		else {
			// otherwise, cleaning up and init-ing again should be sufficient... hopefully
			experiments[experimentId]?.cleanup?.();
			experiments[experimentId]?.init?.();
		}
	});
});

state.experiments.forEach(experiment => {
	if (experiment.enabled) {
		experiments[experiment.id]?.init?.();
	}
});

document.documentElement.classList.add("experimentsEverEnabled");
console.log("%cFair warning: the user has experiments enabled.", "font-size: larger; color: red");
