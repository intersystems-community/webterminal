/**
 * Visible hint, bind in particular output position.
 *
 * @constructor
 * @param {Terminal} TERMINAL
 */
var TerminalHint = function (TERMINAL) {

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

TerminalHint.prototype.initialize = function () {
    this.element.className = "terminalHint";
};

/**
 * @param {number} position
 * @param {number} line
 * @param {string} content - HTML string.
 */
TerminalHint.prototype.show = function (position, line, content) {
    this.element.innerHTML = content;
    this.element.style.top =
        this.TERMINAL.output.getLineByIndex(line).getElement().offsetTop + "px";
    this.element.style.left = (position - 1) * this.TERMINAL.output.SYMBOL_PIXEL_WIDTH + "px";
    this.TERMINAL.elements.output.appendChild(this.element);
};

TerminalHint.prototype.hide = function () {
    if (!this.element.parentNode) return;
    this.element.parentNode.removeChild(this.element);
};