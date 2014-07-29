/**
 * Terminal input controller.
 * todo.
 *
 * @param {Terminal} TERMINAL
 * @constructor
 */
var TerminalInput = function (TERMINAL) {

    /**
     * @type {Terminal}
     */
    this.TERMINAL = TERMINAL;

    /**
     * @type {boolean}
     */
    this.ENABLED = false;

    /**
     * @type {TerminalInputHistory}
     */
    this.history = new TerminalInputHistory();

};

/**
 * Enable input.
 *
 * @private
 */
TerminalInput.prototype._enable = function () {

    this.ENABLED = true;
    this.TERMINAL.elements.input.focus();

};

/**
 * Disable input.
 *
 * @private
 */
TerminalInput.prototype._disable = function () {

    this.ENABLED = false;

};

/**
 * @param {string} [invitationMessage]
 * @param {function} handler
 */
TerminalInput.prototype.prompt = function (invitationMessage, handler) {

    if (invitationMessage) this.TERMINAL.output.write(invitationMessage);

    this._enable();

};