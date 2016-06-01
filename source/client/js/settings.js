import * as storage from "./storage";

let STORAGE_NAME = "terminal-settings",
    stored = storage.get(STORAGE_NAME);

/**
 * @readonly
 * @type {{SHOW_PROGRESS_INDICATOR: boolean, HIGHLIGHT_INPUT: boolean, AUTOCOMPLETE: boolean}}
 */
export let OPTIONS = stored ? JSON.parse(stored) : {
    SHOW_PROGRESS_INDICATOR: true,
    HIGHLIGHT_INPUT: true,
    AUTOCOMPLETE: true
};

/**
 * Set the option.
 * @param {string} option
 * @param {*} value
 */
export function set (option, value) {
    OPTIONS[option] = value;
    storage.set(STORAGE_NAME, JSON.stringify(OPTIONS));
}