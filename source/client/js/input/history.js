import * as storage from "../storage";

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
 * Add a record to the history.
 * @param {string} string
 */
export function push (string) {
    if (history[history.length - 1] !== "")
        history.push("");
    history[history.length - 1] = string;
    history.push("");
    current = history.length - 1;
    save();
}

function save () {
    storage.set(STORAGE_NAME, JSON.stringify(history));
}