import * as storage from "./storage";

const STORAGE_NAME = `terminal-favorites`;

let favorites = (JSON.parse(storage.get(STORAGE_NAME)) || {});

/**
 * Returns saved variant or an empty string.
 * @param {string} key
 * @returns {string}
 */
export function get (key) {
    return favorites[key] || "";
}

/**
 * Saves a variant.
 * @param {string} key
 * @param {string} value
 * @returns {string}
 */
export function set (key, value) {
    favorites[key] = value;
    updateStorage();
}

export function list () {
    return Object.assign({}, favorites);
}

/**
 * Clears a variant or clears all variants.
 * @param {string} [key]
 * @returns {boolean}
 */
export function clear (key) {
    let changed = false;
    if (key) {
        if (favorites.hasOwnProperty(key)) changed = true;
        delete favorites[key];
    } else {
        if (Object.keys(favorites).length) changed = true;
        favorites = {};
    }
    updateStorage();
    return changed;
}

function updateStorage () {
    storage.set(STORAGE_NAME, JSON.stringify(favorites));
}