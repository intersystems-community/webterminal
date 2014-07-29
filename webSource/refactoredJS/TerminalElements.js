/**
 * DOM controller for terminal. Initializes all terminal elements.
 *
 * Terminal structure:
 * <parentElement> - block which has at least non-zero width and height
 *     <terminal> - terminal window which will fill parent by 100% width and 100% height
 *        <outputCentralizer> - wrapper to centralize terminal output.
 *            <outputCentralizer> - another wrapper
 *                <output> - scrollable output container
 *                    <input/> - floating input
 *                    [content]
 *                </output>
 *            </outputCentralizer>
 *        </outputCentralizer>
 *        <additionalPanel>
 *            [content]
 *        </additionalPanel>
 *     </terminal>
 * </parentElement>
 *
 * @param {HTMLElement} parentElement - Where to create terminal application.
 * @constructor
 */
var TerminalElements = function (parentElement) {

    /**
     * @type {HTMLElement}
     */
    this.terminal = document.createElement("div");

    /**
     * @type {HTMLElement}
     */
    this.output = document.createElement("div");

    /**
     * @type {HTMLInputElement}
     */
    this.input = document.createElement("input");

    this._initialize(parentElement);

};

/**
 * Create and bind to view all the elements.
 *
 * @param {HTMLElement} parentElement
 * @private
 */
TerminalElements.prototype._initialize = function (parentElement) {

    var centralizer = document.createElement("div"),
        centralizerInner = document.createElement("div");

    this.terminal.className = "terminal-base";
    centralizer.className = "terminal-output-centralizer";
    this.output.className = "terminal-output";

    this.output.appendChild(this.input);
    centralizerInner.appendChild(this.output);
    centralizer.appendChild(centralizerInner);
    this.terminal.appendChild(centralizer);
    parentElement.appendChild(this.terminal);

};