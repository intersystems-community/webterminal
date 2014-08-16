/**
 * Controls the input history of terminal application.
 *
 * @param {TerminalInput} INPUT
 * @constructor
 */
var TerminalInputHistory = function (INPUT) {

    /**
     * @type {TerminalInput}
     */
    this.INPUT = INPUT;

    /**
     * @type {string[]}
     * @private
     */
    this._history = [""];

    /**
     * @type {number}
     * @private
     */
    this._currentPosition = 0;

    this.initialize();

};

TerminalInputHistory.prototype.STORAGE_NAME = "inputHistory";

TerminalInputHistory.prototype.MAX_STACK_SIZE = 200;

TerminalInputHistory.prototype.initialize = function () {

    var _this = this,
        storage = this.INPUT.TERMINAL.storage.get(this.STORAGE_NAME);

    window.addEventListener("keydown", function (event) {
        if (event.keyCode === 38) { // UP
            _this.seek(-1);
            _this.INPUT.set(_this.getCurrent());
        } else if (event.keyCode === 40) { // DOWN
            _this.seek(1);
            _this.INPUT.set(_this.getCurrent());
        }
    });

    window.addEventListener("beforeunload", function () {
        _this.INPUT.TERMINAL.storage.set(_this.STORAGE_NAME, _this.exportJSON());
    });

    if (storage) {
        this.importJSON(storage);
        this._currentPosition = this._history.length - 1;
    }

};

/**
 * Imports history from exported object.
 *
 * @param {string} json
 */
TerminalInputHistory.prototype.importJSON = function (json) {

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
TerminalInputHistory.prototype.exportJSON = function () {
    return JSON.stringify({ _history: this._history });
};

/**
 * @param {number} delta - 1 or -1 to list history records.
 */
TerminalInputHistory.prototype.seek = function (delta) {
    this._currentPosition = (delta + this._currentPosition) % this._history.length;
    if (this._currentPosition < 0) this._currentPosition += this._history.length;
};

/**
 * Gets history record by its position in memory.
 *
 * @param {number} position
 * @returns {string}
 */
TerminalInputHistory.prototype.get = function (position) {
    return this._history[position] || "";
};

/**
 * Saves text to current history.
 *
 * @param {string} text
 */
TerminalInputHistory.prototype.save = function (text) {

    if (this._history[this._history.length - 2] === text || text === "") {
        return;
    }

    this._history[this._history.length - 1] = text;
    this._history.push("");

    if (this._history.length > this.MAX_STACK_SIZE) this._history.splice(0, 1);

    this._currentPosition = this._history.length - 1;

};

/**
 * Returns current history record.
 *
 * @returns {string}
 */
TerminalInputHistory.prototype.getCurrent = function () {

    return this._history[this._currentPosition] || "";

};

/**
 * Returns history record with increment. This method changes current work history field.
 *
 * @param {number} increment
 * @returns {string}
 */
TerminalInputHistory.prototype.load = function (increment) {

    this._currentPosition += increment;
    if (this._currentPosition < 0) this._currentPosition = history.length - 1;
    if (this._currentPosition >= history.length) this._currentPosition = 0;
    return this.getCurrent();

};