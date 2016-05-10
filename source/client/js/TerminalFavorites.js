/**
 * Stores and manipulates favorite commands data.
 *
 * @param {Terminal} TERMINAL
 * @constructor
 */
var TerminalFavorites = function (TERMINAL) {

    /**
     * @type {Terminal}
     */
    this.TERMINAL = TERMINAL;

    this._storage = {};

    this.initialize();

};

TerminalFavorites.prototype.STORAGE_NAME = "terminal-favorites";

TerminalFavorites.prototype.initialize = function () {

    var _this = this,
        storage = this.TERMINAL.storage.get(this.STORAGE_NAME);

    window.addEventListener("beforeunload", function () {
        _this.TERMINAL.storage.set(_this.STORAGE_NAME, _this.exportJSON());
    });

    if (storage) {
        this.importJSON(storage);
    }

};

/**
 * @param {number|string} key
 * @param {string} value
 */
TerminalFavorites.prototype.set = function (key, value) {

    this._storage[key] = value;

};

/**
 * @returns {string}
 */
TerminalFavorites.prototype.get = function (key) {

    return this._storage[key] || "";

};

/**
 * Get list of saved favorites.
 *
 * @returns {string[]}
 */
TerminalFavorites.prototype.getList = function () {

    var arr = [],
        i;

    for (i in this._storage) {
        arr.push(i);
    }

    return arr;

};

/**
 * Imports history from exported object.
 *
 * @param {string} json
 */
TerminalFavorites.prototype.importJSON = function (json) {

    var data, i;

    try {
        data = JSON.parse(json);
        for (i in this) {
            if (!this.hasOwnProperty(i)) continue;
            this[i] = data[i] || this[i];
        }
    } catch (e) { console.error(e); }

};

/**
 * Extorts history to object.
 *
 * @returns {string}
 */
TerminalFavorites.prototype.exportJSON = function () {

    return JSON.stringify({ _storage: this._storage });

};