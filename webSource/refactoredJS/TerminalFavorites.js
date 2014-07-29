/**
 * Stores and manipulates favorite commands data.
 *
 * @constructor
 */
var TerminalFavorites = function () {

    this._storage = {};

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

    return JSON.stringify(this);

};