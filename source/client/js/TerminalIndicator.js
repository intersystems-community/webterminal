/**
 * Visible indicator. Indicates loading or something else.
 *
 * @constructor
 * @param {Terminal} TERMINAL
 */
var TerminalIndicator = function (TERMINAL) {

    /**
     * @type {Terminal}
     */
    this.TERMINAL = TERMINAL;

    /**
     * @type {HTMLElement}
     */
    this.element = document.createElement("div");

    this.initialize();

};

TerminalIndicator.prototype.initialize = function () {
    this.element.className = "terminalIndicator";
};

/**
 * Show indicator.
 */
TerminalIndicator.prototype.show = function () {
    this.TERMINAL.elements.output.appendChild(this.element);
};

/**
 * Hide indicator.
 */
TerminalIndicator.prototype.hide = function () {
    if (!this.element.parentNode) return;
    this.element.parentNode.removeChild(this.element);
};