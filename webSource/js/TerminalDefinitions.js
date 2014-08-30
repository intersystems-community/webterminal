/**
 * Allows to define short phrases that will be replaced with something else.
 *
 * @param {Terminal} TERMINAL
 * @constructor
 */
var TerminalDefinitions = function (TERMINAL) {

    /**
     * @type {Terminal}
     */
    this.TERMINAL = TERMINAL;

    this._storage = {};

    this.initialize();

};

TerminalDefinitions.prototype.STORAGE_NAME = "terminal-definitions";

TerminalDefinitions.prototype.initialize = function () {

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
 * @param {number|string} phrase
 * @param {string} replacement
 */
TerminalDefinitions.prototype.define = function (phrase, replacement) {

    this._storage[phrase] = replacement;

};

/**
 * @returns {boolean}
 */
TerminalDefinitions.prototype.clear = function () {

    this._storage = {};

};

/**
 * Get list of saved definitions.
 *
 * @returns {string[]}
 */
TerminalDefinitions.prototype.getList = function () {

    var arr = [],
        i;

    for (i in this._storage) {
        arr.push(i);
    }

    return arr;

};

/**
 * Replaces defined phrases in string.
 *
 * @param {string} string
 * @returns {string}
 */
TerminalDefinitions.prototype.replace = function (string) {

    var i;

    for (i in this._storage) {
        string = string.replace(i, this._storage[i]);
    }

    return string;

};

/**
 * Imports history from exported object.
 *
 * @param {string} json
 */
TerminalDefinitions.prototype.importJSON = function (json) {

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
TerminalDefinitions.prototype.exportJSON = function () {
    return JSON.stringify({ _storage: this._storage });
};