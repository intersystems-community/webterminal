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
    this.CONTROL_SEQUENCE_PATTERN = /[\x00-\x1A]|\x1b\[?[^@-~]*[@-~]/g;

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
     * Holds the tab positions.
     *
     * @type {{position: boolean}}
     * @private
     */
    this._tabs = {};

    /**
     * When enabled, caret position will be limited in [1, WIDTH] by X and [1, HEIGHT] by Y axis.
     *
     * This enables terminal to print content out of it's viewport.
     *
     * MAKE SURE TO SET "true" VALUE BACK IN THE SAME CODE SCOPE WHEN USED.
     *
     * @type {boolean} flag
     */
    this.$CARET_RESTRICTION_ON = true;

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

    this.initialize();

};

/**
 * @type {string}
 */
TerminalOutput.prototype.LINE_CLASSNAME = "terminalLine";

TerminalOutput.prototype.initialize = function () {

    var _this = this,
        x;

    setInterval(function () {
        _this.freeStack();
    }, this.STACK_REFRESH_INTERVAL);
    window.addEventListener("resize", function () {
        _this.sizeChanged();
    });

    this.sizeChanged();

    // set initial tabs
    for (x = 9; x < this.WIDTH; x += 8) {
        this.setTab(x);
    }

};

/**
 * Set tab at position x.
 *
 * @param {number} x
 */
TerminalOutput.prototype.setTab = function (x) {
    this._tabs[x] = true;
};

/**
 * Clear tabs. If position is not defined, clears all tabs.
 *
 * @param {number} [position]
 */
TerminalOutput.prototype.clearTab = function (position) {
    if (position) {
        delete this._tabs[position];
    } else {
        this._tabs = {};
    }
};

/**
 * Sets caret X position. Caret position is limited by terminal output size.
 *
 * @param {number} x
 * @returns {boolean} - If position wasn't limited and now equal to X.
 */
TerminalOutput.prototype.setCaretX = function (x) {
    this._caret.x = Math.max(1, Math.min(this.WIDTH, x));
    return x === this._caret.x;
};

/**
 * Sets caret Y position. Caret position is limited by terminal output size.
 *
 * @param {number} y
 * @returns {boolean} - If position wasn't limited and now equal to Y.
 */
TerminalOutput.prototype.setCaretY = function (y) {
    this._caret.y = this.$CARET_RESTRICTION_ON ? Math.max(1, Math.min(this.HEIGHT, y)) : y;
    return y === this._caret.y;
};

/**
 * Increase _TOP_LINE for given amount. Use this function if only you know what are you doing.
 *
 * @param {number} delta
 */
TerminalOutput.prototype.increaseTopLine = function (delta) {
    this._TOP_LINE += Math.round(delta);
    if (this._TOP_LINE < 0) {
        this._TOP_LINE = 0;
        console.warn("_TOP_LINE = 0 bottom restriction applied.");
    }
};

/**
 * @returns {number}
 */
TerminalOutput.prototype.getCaretX = function () {
    return this._caret.x;
};

/**
 * @returns {number}
 */
TerminalOutput.prototype.getCaretY = function () {
    return this._caret.y;
};

/**
 * This object handles implementation of control characters in range \x00..\x1F.
 *
 * @private
 */
TerminalOutput.prototype._controlCharacters = {

    "\x00": function () {

    },

    // \t
    "\x09": function () {

        var x = this.getCaretX();

        for (; x < this.WIDTH; x++) {
            if (this._tabs.hasOwnProperty(x.toString())) {
                this.setCaretX(x);
                break;
            }
        }

    },

    // \n
    "\x0A": function () {

        if (this._caret.y === this.HEIGHT) {
            this.scrollDisplay(1);
        }

        this.setCaretY(this._caret.y + 1);

    },

    // \r
    "\x0D": function () {

        this.setCaretX(1);

    }

};

/**
 * Escape sequences implementation.
 *
 * "lastSequenceCharacter": function (sequence, params) { implementation }
 * Where:
 *  sequence - full escape sequence with escape character
 *  params - symbols between bracket (esc character) and last character
 *
 * @private
 */
TerminalOutput.prototype._controlSequences = {

    // GRAPHIC CONTROL

    "m": function (sequence, params) {

        var codes = params.split(";"),
            i;

        for (i in codes) {
            this.setGraphicRendition(parseInt(codes[i] || 0));
        }

    },

    // CURSOR CONTROL

    "A": function (sequence, params) {
        this.setCaretY(this.getCaretY() - (parseInt(params) || 1));
    },

    "B": function (sequence, params) {
        this.setCaretY(this.getCaretY() + (parseInt(params) || 1));
    },

    "C": function (sequence, params) {
        this.setCaretX(this.getCaretX() + (parseInt(params) || 1));
    },

    "D": function (sequence, params) {
        this.setCaretX(this.getCaretX() - (parseInt(params) || 1));
    },

    "f": function (sequence, params) {

        var positions = params.split(";");

        this.setCaretX(parseInt(positions[1] || 1));
        this.setCaretY(parseInt(positions[0] || 1));

    },

    "H": function (sequence, params) {

        if (sequence.charAt(1) === "[") {

            this._controlSequences.f.call(this, sequence, params);

        } else { // TAB CONTROL

            this.setTab(this.getCaretX());

        }

    },

    // TAB CONTROL

    "g": function (sequence, params) {

        if (params === "3") {
            this.clearTab();
        } else {
            this.clearTab(this.getCaretX());
        }

    },

    "G": function (sequence, params) {

        this.setCaretX(parseInt(params) || 1);

    }

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

    var i, letter;

    if (i = sequence.match(/[\x00-\x1A]/)) {

        if (this._controlCharacters.hasOwnProperty(i[0])) {
            this._controlCharacters[i[0]].call(this);
        }

    } else if (i = sequence.match(/\x1b\[?([^@-~]*)([@-~])/)) {

        letter = i[2];

        if (this._controlSequences.hasOwnProperty(letter)) {
            this._controlSequences[letter].call(this, i[0], i[1]);
        }

    }

};

/**
 * @returns {TerminalOutputLine}
 */
TerminalOutput.prototype.getTopLine = function () {

    var u;

    for (u = this._lines.length; u <= this._TOP_LINE; u++) {
        this._lines[u] = new TerminalOutputLine(this);
    }

    return this._lines[this._TOP_LINE];

};

/**
 * Returns current line. New lines will be added if they does not exists.
 *
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
 * Outputs new line.
 */
TerminalOutput.prototype.newLineSequence = function () {

    // do not flip to .print - may cause recursion. || change _outPlainText
    this.applyControlSequence("\r");
    this.applyControlSequence("\n");

};

/**
 * Returns actual line number of all terminal output.
 *
 * @returns {number}
 */
TerminalOutput.prototype.getLineNumber = function () {
    return this._TOP_LINE + this._caret.y - 1;
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
TerminalOutput.prototype._printPlainText = function (string) {

    var line, xDelta;

    do {

        line = this.getCurrentLine();

        xDelta = string.length;
        string = line.writePlain(string, this._caret.x - 1);
        xDelta -= string.length;

        if (string) {
            this.newLineSequence();
        } else if (!this.setCaretX(this._caret.x + xDelta)) {
            this.newLineSequence();
        }

    } while (string);

};

/**
 * Output and parse text with control symbols.
 *
 * @param {string=} text
 * @private
 */
TerminalOutput.prototype._output = function (text) {

    var textOrigin = text || "",
        lastIndex = 0,
        textLeft,
        _this = this;

    text = text || "";
    text.replace(this.CONTROL_SEQUENCE_PATTERN, function(part, index, string) {
        var beforePart = string.substring(lastIndex, index);
        if (!lastIndex) textOrigin = string;
        lastIndex = index + part.length;
        if (beforePart) _this._printPlainText(beforePart);
        _this.applyControlSequence(part);
        return "";
    });

    textLeft = textOrigin.substring(lastIndex, textOrigin.length);

    if (textLeft) this._printPlainText(textLeft);

};

/**
 * Moves text to output stack.
 *
 * @param text {string}
 */
TerminalOutput.prototype.print = function (text) {

    this._stack += text;

};

/**
 * May print text out-of-terminal (by Y axis). Synchronous operation.
 *
 * @param {string} text
 * @param {number} line
 * @param {number} position
 * @param {boolean=true} restrictCaret - restrict caret position to terminal window at end.
 */
TerminalOutput.prototype.printAtLine = function (text, line, position, restrictCaret) {

    var lastRestriction = this.$CARET_RESTRICTION_ON;

    if (typeof restrictCaret === "undefined") restrictCaret = true;

    this.$CARET_RESTRICTION_ON = false;
    this._caret.x = position + 1;
    this._caret.y = line - this._TOP_LINE + 1;
    this.printSync(text);

    if (restrictCaret) { // limit caret again
        this.$CARET_RESTRICTION_ON = true;
        this.setCaretX(this.getCaretX());
        this.setCaretY(this.getCaretY());
    }

    this.$CARET_RESTRICTION_ON = lastRestriction;

};

/**
 * Writing output to object immediately.
 *
 * @param {string} [text]
 */
TerminalOutput.prototype.printSync = function (text) {

    this.freeStack();
    this.print(text || "");
    this.freeStack();

};

TerminalOutput.prototype.freeStack = function () {

    if (!this._stack) return;
    this._output(this._stack);
    this._stack = "";
    this.scrollToActualLine();

};

/**
 * Clears output field.
 */
TerminalOutput.prototype.clear = function () {

    this.printSync();
    this._TOP_LINE = this._lines.length;
    this._spawnLines(this.HEIGHT);
    this.scrollToActualLine();
    this.setCaretX(1);
    this.setCaretY(1);

};

/**
 * Scrolls terminal to _TOP_LINE.
 */
TerminalOutput.prototype.scrollToActualLine = function () {
    this.TERMINAL.elements.output.scrollTop = this.getTopLine().getElement().offsetTop;
};

/**
 * Window size change handler. Recalculates terminal sizes.
 * Changes this.WIDTH and this.HEIGHT constants and resizes this.TERMINAL.elements.output
 */
TerminalOutput.prototype.sizeChanged = function () {

    var tel = document.createElement("span"),
        testScrollbar = document.createElement("div"),
        scrollBarWidth,
        lastProperty = this.TERMINAL.elements.output.style.overflowY;

    this.TERMINAL.elements.output.style.overflowY = "scroll";

    this.TERMINAL.elements.output.appendChild(testScrollbar);
    scrollBarWidth = this.TERMINAL.elements.output.offsetWidth - testScrollbar.offsetWidth;
    this.TERMINAL.elements.output.style.overflowY = lastProperty;

    tel.className = this.LINE_CLASSNAME;
    tel.innerHTML = "XXXXXXXXXX";
    this.TERMINAL.elements.output.appendChild(tel);

    this.SYMBOL_PIXEL_WIDTH = tel.offsetWidth/10;
    this.SYMBOL_PIXEL_HEIGHT = tel.offsetHeight;

    this.WIDTH = Math.floor(
            (this.TERMINAL.elements.terminal.offsetWidth - scrollBarWidth) / this.SYMBOL_PIXEL_WIDTH
    );
    this.HEIGHT = Math.floor(
            this.TERMINAL.elements.terminal.offsetHeight / this.SYMBOL_PIXEL_HEIGHT
    );

    this.TERMINAL.elements.output.style.width =
        (this.WIDTH * this.SYMBOL_PIXEL_WIDTH + scrollBarWidth) + "px";
    this.TERMINAL.elements.output.style.height = (this.HEIGHT * this.SYMBOL_PIXEL_HEIGHT) + "px";

    this.TERMINAL.elements.output.removeChild(testScrollbar);
    this.TERMINAL.elements.output.removeChild(tel);

};