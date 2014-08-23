/**
 * Local storage control.
 *
 * Reserved keys: lastSaveDate, restoreSession.
 * After set up, the next terminal initialization will restore data from local storage.
 *
 * @constructor
 */
var TerminalStorage = function () {

    if (typeof JSON === "undefined") {
        throw new
            Error("Browser does not support html5 local storage. Please, update your browser");
    }

};

/**
 * Returns last saved date or null if last date wasn't saved.
 *
 * @returns {Date|null}
 */
TerminalStorage.prototype.getLastSaveDate = function () {
    var d = localStorage.getItem("lastSaveDate");
    return d?new Date(d):d;
};

/**
 * Forces to modify last save data.
 *
 * @param {Date} date
 */
TerminalStorage.prototype.setLastSaveDate = function (date) {
    localStorage.setItem("lastSaveDate", date.toJSON());
};

/**
 * Clears all stored data.
 */
TerminalStorage.prototype.clear = function () {
    localStorage.clear();
};

/**
 * Sets the local storage key.
 *
 * @param {string} key
 * @param {string} value
 */
TerminalStorage.prototype.set = function (key, value) {
    localStorage.setItem(key, value);
};

/**
 * Removes value of key from storage.
 *
 * @param {string} key
 */
TerminalStorage.prototype.remove = function (key) {
    localStorage.removeItem(key);
};

/**
 * Gets local storage key value.
 *
 * @param {string} key
 * @returns {string}
 */
TerminalStorage.prototype.get = function (key) {
    return localStorage.getItem(key);
};