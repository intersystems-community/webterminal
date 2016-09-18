import { printLine } from "./output";
import * as locale from "./localization";

if (typeof JSON === "undefined" || typeof localStorage === "undefined") {
    printLine(locale.get(`storageErr`));
}

/**
 * Clears all stored data.
 */
export function clear () {
    localStorage.clear();
}

/**
 * Sets the local storage key.
 * @param {string} key
 * @param {string} value
 */
export function set (key, value) {
    localStorage.setItem(key, value);
}

/**
 * Removes value of key from storage.
 * @param {string} key
 */
export function remove (key) {
    localStorage.removeItem(key);
}

/**
 * Gets local storage key value.
 * @param {string} key
 * @returns {string|null}
 */
export function get (key) {
    return localStorage.getItem(key);
}