import * as storage from "../storage";
import * as config from "../config";

const STORAGE_NAME = `terminal-history`;

let history = (JSON.parse(storage.get(STORAGE_NAME)) || [""]),
    current = history.length - 1;

/**
 * Get the history variant relative to the current.
 * @param {number} increment - Return previous or next history variant.
 * @returns {string}
 */
export function get (increment = 0) {
    if (increment && history.length)
        current = (current + history.length + increment) % history.length;
    return history[current] || "";
}

/**
 * Set the latest history state to string.
 * @param {string} string
 */
export function set (string) {
    let c = history.length - 1;
    history[c < 0 ? 0 : c] = string;
}

/**
 * Returns if the current history state is the last one.
 * @returns {boolean}
 */
export function isLast () {
    return current === history.length - 1;
}

export function setLast (string = "") {
    let c = history.length - 1;
    current = c < 0 ? 0 : c;
    if (string)
        history[current] = string;
}

/**
 * Add a record to the history.
 * @param {string} string
 */
export function push (string) {
    if (!string || history[history.length - 2] === string) {
        current = history.length - 1;
        return;
    }
    history[history.length - 1] = string;
    history.push("");
    current = history.length - 1;
    save();
}

function save () {
    storage.set(STORAGE_NAME, JSON.stringify(history.slice(-config.get("maxHistorySize"))));
}