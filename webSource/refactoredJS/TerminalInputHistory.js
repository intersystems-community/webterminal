/**
 * Controls the input history of terminal application.
 *
 * @param {Terminal} terminal
 * @constructor
 */
var TerminalInputHistory = function (terminal) {

    this._terminal = terminal;
    this._history = [""];
    this._currentPosition = 0;

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
 * Imports history from exported object.
 *
 * @param {string} historyJSON
 */
TerminalInputHistory.prototype.importJSON = function (historyJSON) {

    var data;

    try {
        data = JSON.parse(historyJSON);
        this._history = data["_history"] || [""];
        this._currentPosition = data["_currentPosition"];
    } catch (e) { console.error(e); }

    // todo: _terminal.input.set(this.getCurrent());

};

/**
 * Extorts history to object.
 *
 * @returns {string}
 */
TerminalInputHistory.prototype.exportJSON = function () {
    return JSON.stringify(this);
};

/**
 * Saves text to current history.
 *
 * @param {string} text
 */
TerminalInputHistory.prototype.save = function (text) {
    this._history[this._currentPosition] = text;
};

/**
 * Creates new history record for current input.
 */
TerminalInputHistory.prototype.append = function () {
    if (this.getCurrent() === "" || this.getCurrent() === this.get(this._currentPosition - 1)) {
        return;
    }
    this._currentPosition = history.length;
    this._history.push("");
};

/**
 * Seeks current history position to last.
 */
TerminalInputHistory.prototype.seekToEnd = function () {
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