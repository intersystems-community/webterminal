/**
 * Represents output and everything related to it.
 * todo: reorganise "animations" usage
 * todo: remove "highlight output" option
 *
 * @param {Terminal} TERMINAL
 */
var TerminalOutput = function (TERMINAL) {

    /**
     * @type {Terminal}
     */
    this.TERMINAL = TERMINAL;

    /**
     * Output stack. Each output operation will be written to stack first.
     *
     * @type {string}
     * @private
     */
    this._stack = "";

    /**
     * Terminal output are based on lines of rendered text. This variable shows which line number
     * will define Y = 1 caret position.
     *
     * @type {number}
     * @private
     */
    this._TOP_LINE = 0;

    /**
     * Width of one terminal symbol.
     *
     * @type {number}
     */
    this.SYMBOL_PIXEL_WIDTH = 0;

    /**
     * Height of one terminal symbol.
     *
     * @type {number}
     */
    this.SYMBOL_PIXEL_HEIGHT = 0;

    /**
     * Regular expression that must match any control symbols such as "\r" or "\n" and escape
     * sequences.
     *
     * @type {RegExp}
     */
    this.CONTROL_SEQUENCE_PATTERN = /[\r\n]|\x1b\[?[^@-~]*[@-~]/g; // todo: fix and debug

    /**
     * Object that includes current graphic rendition flags as a key.
     *
     * @type {{number: boolean}}
     * @private
     */
    this.CURRENT_GRAPHIC_RENDITION = {};

    /**
     * Array of TerminalOutputLine instances.
     *
     * @type {TerminalOutputLine[]}
     * @private
     */
    this._lines = [];

    /**
     * Caret position.
     *
     * @type {{x: number, y: number}}
     */
    this._caret = {
        x: 1,
        y: 1
    };

    /**
     * Current terminal output width in symbols.
     *
     * @type {number}
     */
    this.WIDTH = 0;

    /**
     * Current terminal output height in symbols.
     *
     * @type {number}
     */
    this.HEIGHT = 0;

    /**
     * @type {number} - Milliseconds.
     */
    this.STACK_REFRESH_INTERVAL = 25;

    setInterval(this.freeStack, this.STACK_REFRESH_INTERVAL);

};

/**
 * @type {string}
 */
TerminalOutput.prototype.LINE_CLASSNAME = "terminal-line";

/**
 * Sets caret X position. Caret position is limited by terminal output size.
 *
 * @param {number} x
 */
TerminalOutput.prototype.setCaretX = function (x) {
    this._caret.x = Math.max(1, Math.min(this.WIDTH, x));
};

/**
 * Sets caret Y position. Caret position is limited by terminal output size.
 *
 * @param {number} y
 */
TerminalOutput.prototype.setCaretY = function (y) {
    this._caret.y = Math.max(1, Math.min(this.HEIGHT, y));
};

/**
 * Scrolls the display down.
 *
 * @param {number} delta - Positive to scroll down.
 */
TerminalOutput.prototype.scrollDisplay = function (delta) {

    if (delta > 0) {
        this._TOP_LINE += delta;
    } else {
        console.warn("Todo: scroll up");
    }

};

/**
 * Shows if there are any current graphic rendition flags.
 *
 * @returns {boolean}
 */
TerminalOutput.prototype.anyGraphicRenditionSet = function () {

    var i;

    for (i in this.CURRENT_GRAPHIC_RENDITION) {
        if (this.CURRENT_GRAPHIC_RENDITION.hasOwnProperty(i)) return true;
    }

    return false;

};

/**
 * Sets the graphic rendition index. Zero as a parameter will clear any present indexes.
 *
 * @param {number} index
 */
TerminalOutput.prototype.setGraphicRendition = function (index) {

    if (index === 0) {
        this.CURRENT_GRAPHIC_RENDITION = {};
    } else {
        this.CURRENT_GRAPHIC_RENDITION[index] = true;
    }

};

/**
 * Sequence parsing and performing.
 *
 * @param {string} sequence - Must include only one sequence.
 */
TerminalOutput.prototype.applyControlSequence = function (sequence) {

    var codes, i;

    if (sequence === "\r") {

        this.setCaretX(1);

    } else if (sequence === "\n") {

        if (this._caret.y === this.HEIGHT) {
            this.scrollDisplay(1);
        }

        this.setCaretY(this._caret.y + 1);

    } else if (sequence.match(/\x1b\[[0-9;]+m/)) {

        codes = sequence.match(/[0-9;]+/)[0].split(";");

        for (i in codes) {
            this.setGraphicRendition(parseInt(codes[i]));
        }

    }

};

/**
 * @returns {TerminalOutputLine}
 */
TerminalOutput.prototype.getCurrentLine = function () {

    var i = this._TOP_LINE + (this._caret.y - 1),
        u;

    for (u = this._lines.length; u <= i; u++) {
        this._lines[u] = new TerminalOutputLine(this);
    }

    return this._lines[i];

};

/**
 * Add empty lines to the end of terminal output.
 *
 * @param {number} number
 * @private
 */
TerminalOutput.prototype._spawnLines = function (number) {

    for (; number > 0; number--) {
        this._lines.push(new TerminalOutputLine(this));
    }

};

/**
 * Outputs plain text to caret position (x;y) to terminal output.
 *
 * @param {string} string - String of plain text. This DOES NOT include any control characters or
 *                          sequences.
 * @private
 */
TerminalOutput.prototype._writePlainText = function (string) {

    var line, xDelta;

    do {

        line = this.getCurrentLine();

        xDelta = string.length;
        string = line.writePlain(string, this._caret.x - 1);
        xDelta -= string.length;

        if (string) {
            this.applyControlSequence("\r");
            this.applyControlSequence("\n");
        } else this.setCaretX(this._caret.x + xDelta);

    } while (string);

};

/**
 * Output and parse text with control symbols.
 *
 * @param {string} text
 * @private
 */
TerminalOutput.prototype._output = function (text) {

    var textOrigin = text,
        lastIndex = 0,
        textLeft,
        _this = this;

    text.replace(this.CONTROL_SEQUENCE_PATTERN, function(part, index, string) {
        var beforePart = string.substring(lastIndex, index);
        if (!lastIndex) textOrigin = string;
        lastIndex = index + part.length;
        if (beforePart) _this._writePlainText(beforePart);
        _this.applyControlSequence(part);
        return "";
    });

    textLeft = textOrigin.substring(lastIndex, textOrigin.length);

    if (textLeft) this._writePlainText(textLeft);

};

/**
 * Moves text to output stack.
 *
 * @param text {string}
 */
TerminalOutput.prototype.write = function (text) {

    this._stack += text;

};

/**
 * Writing output to object immediately.
 *
 * @param {string} [text]
 */
TerminalOutput.prototype.forceWrite = function (text) {

    this.write(text);
    this.freeStack();

};

TerminalOutput.prototype.freeStack = function () {

    if (!this._stack) return;
    this._output(this._stack);
    // dom.scrollBottom(); todo: scroll to line, is it required?
    this._stack = "";

};

/**
 * Clears output field.
 * @deprecated - CWTv2: use escape sequence instead.
 */
TerminalOutput.prototype.clear = function () {

    this.scrollDisplay(this._lines.length - this._TOP_LINE);
    this._spawnLines(this.HEIGHT);
    this.setCaretX(1);
    this.setCaretY(1);
    // dom.scrollBottom(); todo: scroll to line

};

/**
 * Window size change handler. Recalculates terminal sizes.
 *
 * todo: fix non-chromium margins, scrollbar.
 */
TerminalOutput.prototype.sizeChanged = function () {

    var tel = document.createElement("span");

    tel.className = this.LINE_CLASSNAME;

    this.TERMINAL.elements.output.appendChild(tel);
    tel.innerHTML = "XXX<br/>XXX<br/>XXX";

    this.SYMBOL_PIXEL_WIDTH = Math.floor(tel.offsetWidth/3);
    this.SYMBOL_PIXEL_HEIGHT = Math.floor(tel.offsetHeight/3);

    this.WIDTH = this.TERMINAL.elements.terminal.offsetWidth / this.SYMBOL_PIXEL_WIDTH;
    this.HEIGHT = this.TERMINAL.elements.terminal.offsetHeight / this.SYMBOL_PIXEL_HEIGHT;

    dom.objects.output.style.width = (this.WIDTH * this.SYMBOL_PIXEL_WIDTH) + "px";
    dom.objects.output.style.height = (this.HEIGHT * this.SYMBOL_PIXEL_HEIGHT) + "px";

    dom.objects.output.removeChild(tel);

};