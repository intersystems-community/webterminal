/**
 * Represents output and everything related to it.
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
    this._TOP_LINE_INDEX = 0;

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
     * @private
     */
    this._scrolling = {
        enabled: false,
        lineStart: 0,
        lineEnd: 0
    };

    /**
     * Holds the tab positions.
     *
     * @type {Object}
     *        tabPosition: boolean
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

TerminalOutput.prototype.COLOR_8BIT = {
     "0":   "#000000", "1":   "#800000", "2":   "#008000", "3":   "#808000", "4":   "#000080",
     "5":   "#800080", "6":   "#008080", "7":   "#c0c0c0", "8":   "#808080", "9":   "#ff0000",
     "10":  "#00ff00", "11":  "#ffff00", "12":  "#0000ff", "13":  "#ff00ff", "14":  "#00ffff",
     "15":  "#ffffff", "16":  "#000000", "17":  "#00005f", "18":  "#000087", "19":  "#0000af",
     "20":  "#0000df", "21":  "#0000ff", "22":  "#005f00", "23":  "#005f5f", "24":  "#005f87",
     "25":  "#005faf", "26":  "#005fdf", "27":  "#005fff", "28":  "#008700", "29":  "#00875f",
     "30":  "#008787", "31":  "#0087af", "32":  "#0087df", "33":  "#0087ff", "34":  "#00af00",
     "35":  "#00af5f", "36":  "#00af87", "37":  "#00afaf", "38":  "#00afdf", "39":  "#00afff",
     "40":  "#00df00", "41":  "#00df5f", "42":  "#00df87", "43":  "#00dfaf", "44":  "#00dfdf",
     "45":  "#00dfff", "46":  "#00ff00", "47":  "#00ff5f", "48":  "#00ff87", "49":  "#00ffaf",
     "50":  "#00ffdf", "51":  "#00ffff", "52":  "#5f0000", "53":  "#5f005f", "54":  "#5f0087",
     "55":  "#5f00af", "56":  "#5f00df", "57":  "#5f00ff", "58":  "#5f5f00", "59":  "#5f5f5f",
     "60":  "#5f5f87", "61":  "#5f5faf", "62":  "#5f5fdf", "63":  "#5f5fff", "64":  "#5f8700",
     "65":  "#5f875f", "66":  "#5f8787", "67":  "#5f87af", "68":  "#5f87df", "69":  "#5f87ff",
     "70":  "#5faf00", "71":  "#5faf5f", "72":  "#5faf87", "73":  "#5fafaf", "74":  "#5fafdf",
     "75":  "#5fafff", "76":  "#5fdf00", "77":  "#5fdf5f", "78":  "#5fdf87", "79":  "#5fdfaf",
     "80":  "#5fdfdf", "81":  "#5fdfff", "82":  "#5fff00", "83":  "#5fff5f", "84":  "#5fff87",
     "85":  "#5fffaf", "86":  "#5fffdf", "87":  "#5fffff", "88":  "#870000", "89":  "#87005f",
     "90":  "#870087", "91":  "#8700af", "92":  "#8700df", "93":  "#8700ff", "94":  "#875f00",
     "95":  "#875f5f", "96":  "#875f87", "97":  "#875faf", "98":  "#875fdf", "99":  "#875fff",
     "100": "#878700", "101": "#87875f", "102": "#878787", "103": "#8787af", "104": "#8787df",
     "105": "#8787ff", "106": "#87af00", "107": "#87af5f", "108": "#87af87", "109": "#87afaf",
     "110": "#87afdf", "111": "#87afff", "112": "#87df00", "113": "#87df5f", "114": "#87df87",
     "115": "#87dfaf", "116": "#87dfdf", "117": "#87dfff", "118": "#87ff00", "119": "#87ff5f",
     "120": "#87ff87", "121": "#87ffaf", "122": "#87ffdf", "123": "#87ffff", "124": "#af0000",
     "125": "#af005f", "126": "#af0087", "127": "#af00af", "128": "#af00df", "129": "#af00ff",
     "130": "#af5f00", "131": "#af5f5f", "132": "#af5f87", "133": "#af5faf", "134": "#af5fdf",
     "135": "#af5fff", "136": "#af8700", "137": "#af875f", "138": "#af8787", "139": "#af87af",
     "140": "#af87df", "141": "#af87ff", "142": "#afaf00", "143": "#afaf5f", "144": "#afaf87",
     "145": "#afafaf", "146": "#afafdf", "147": "#afafff", "148": "#afdf00", "149": "#afdf5f",
     "150": "#afdf87", "151": "#afdfaf", "152": "#afdfdf", "153": "#afdfff", "154": "#afff00",
     "155": "#afff5f", "156": "#afff87", "157": "#afffaf", "158": "#afffdf", "159": "#afffff",
     "160": "#df0000", "161": "#df005f", "162": "#df0087", "163": "#df00af", "164": "#df00df",
     "165": "#df00ff", "166": "#df5f00", "167": "#df5f5f", "168": "#df5f87", "169": "#df5faf",
     "170": "#df5fdf", "171": "#df5fff", "172": "#df8700", "173": "#df875f", "174": "#df8787",
     "175": "#df87af", "176": "#df87df", "177": "#df87ff", "178": "#dfaf00", "179": "#dfaf5f",
     "180": "#dfaf87", "181": "#dfafaf", "182": "#dfafdf", "183": "#dfafff", "184": "#dfdf00",
     "185": "#dfdf5f", "186": "#dfdf87", "187": "#dfdfaf", "188": "#dfdfdf", "189": "#dfdfff",
     "190": "#dfff00", "191": "#dfff5f", "192": "#dfff87", "193": "#dfffaf", "194": "#dfffdf",
     "195": "#dfffff", "196": "#ff0000", "197": "#ff005f", "198": "#ff0087", "199": "#ff00af",
     "200": "#ff00df", "201": "#ff00ff", "202": "#ff5f00", "203": "#ff5f5f", "204": "#ff5f87",
     "205": "#ff5faf", "206": "#ff5fdf", "207": "#ff5fff", "208": "#ff8700", "209": "#ff875f",
     "210": "#ff8787", "211": "#ff87af", "212": "#ff87df", "213": "#ff87ff", "214": "#ffaf00",
     "215": "#ffaf5f", "216": "#ffaf87", "217": "#ffafaf", "218": "#ffafdf", "219": "#ffafff",
     "220": "#ffdf00", "221": "#ffdf5f", "222": "#ffdf87", "223": "#ffdfaf", "224": "#ffdfdf",
     "225": "#ffdfff", "226": "#ffff00", "227": "#ffff5f", "228": "#ffff87", "229": "#ffffaf",
     "230": "#ffffdf", "231": "#ffffff", "232": "#080808", "233": "#121212", "234": "#1c1c1c",
     "235": "#262626", "236": "#303030", "237": "#3a3a3a", "238": "#444444", "239": "#4e4e4e",
     "240": "#585858", "241": "#606060", "242": "#666666", "243": "#767676", "244": "#808080",
     "245": "#8a8a8a", "246": "#949494", "247": "#9e9e9e", "248": "#a8a8a8", "249": "#b2b2b2",
     "250": "#bcbcbc", "251": "#c6c6c6", "252": "#d0d0d0", "253": "#dadada", "254": "#e4e4e4",
     "255": "#eeeeee"
};

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
 * Increase _TOP_LINE_INDEX for given amount. Use this function if only you know what are you doing.
 *
 * @param {number} delta
 */
TerminalOutput.prototype.increaseTopLine = function (delta) {
    this._TOP_LINE_INDEX += Math.round(delta);
    if (this._TOP_LINE_INDEX < 0) {
        this._TOP_LINE_INDEX = 0;
        console.warn("_TOP_LINE_INDEX = 0 bottom restriction applied.");
    }
};

/**
 * Enables scrolling for display part.
 *
 * @param {number} lineStart
 * @param {number} lineEnd
 */
TerminalOutput.prototype.enableScrolling = function (lineStart, lineEnd) {

    if (lineEnd > this.HEIGHT || lineStart < 1 || lineEnd < lineStart) {
        console.warn("Wrong scrolling borders: ", lineStart, lineEnd);
        return;
    }

    this._scrolling.enabled = true;
    this._scrolling.lineStart = lineStart;
    this._scrolling.lineEnd = lineEnd;
    this.setCaretX(1);
    this.setCaretY(1);

};

/**
 * Enables scrolling for entire display.
 */
TerminalOutput.prototype.disableScrolling = function () {

    this._scrolling.enabled = false;

};

/**
 * Scroll part of display. This function will erase lines that overflow scroll region.
 *
 * @param {number} lineFrom - Home line is 1.
 * @param {number} lineTo - Home line is 1.
 * @param {number} amount - Positive number will scroll display UP.
 */
TerminalOutput.prototype.scrollDisplayPart = function (lineFrom, lineTo, amount) {

    var lastLine = this.getLineByIndex(this._TOP_LINE_INDEX + lineTo), // to ensure that line exists
        affectiveLines = this._lines.slice(
            this._TOP_LINE_INDEX + lineFrom - 1, this._TOP_LINE_INDEX + lineTo
        ),
        nullF = {getElement: function () { return null; }},
        len = affectiveLines.length,
        aliveLines = affectiveLines.
            slice(Math.min(Math.max(0, amount), len), Math.max(Math.min(len, len + amount), 0)),
        appendBeforeLine = amount > 0
            ? (lastLine || nullF).getElement() || null
            : (aliveLines[0] || nullF).getElement()
            || (lastLine || nullF).getElement() || null,
        linesToAppend = affectiveLines.length - aliveLines.length,
        i;

    for (i = 0; i < linesToAppend; i++) { // lines to append === lines to kill
        affectiveLines[amount > 0 ? "shift" : "pop"]().remove();
    }

    for (i = 0; i < linesToAppend; i++) {
        aliveLines[amount > 0 ? "push" : "unshift"].apply(aliveLines, [
            new TerminalOutputLine(this, appendBeforeLine)
        ]);
    }

    this._lines.splice.apply(this._lines,
        [this._TOP_LINE_INDEX + lineFrom - 1, aliveLines.length].concat(aliveLines)
    );

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

        if (this._scrolling.enabled && this._caret.y === this._scrolling.lineEnd) {
            this.scrollDisplayPart(this._scrolling.lineStart, this._scrolling.lineEnd, 1);
        } else {
            if (this._caret.y === this.HEIGHT) {
                this.scrollDisplay(1);
            }
            this.setCaretY(this._caret.y + 1);
        }

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

        var codes = params.split(";").map(function(item) {
                return parseInt(item, 10);
            }),
            i;

        for (i = 0; i < codes.length; i++) {
            if (codes[i] === 38 && codes[i+1] === 5) {
                this.setGraphicRendition(38, "color: " + this.COLOR_8BIT[codes[i+2]]);
                i += 2;
            } else if (codes[i] === 48 && codes[i+1] === 5) {
                this.setGraphicRendition(48, "background-color: " + this.COLOR_8BIT[codes[i+2]]);
                i += 2;
            } else this.setGraphicRendition(codes[i] || 0);
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
        if (sequence.charAt(1) === "[") {
            this.setCaretX(this.getCaretX() - (parseInt(params) || 1));
        } else { // scroll down
            if (this._scrolling.enabled) {
                this.scrollDisplayPart(this._scrolling.lineStart, this._scrolling.lineEnd, -1);
            }
        }
    },

    "M": function () { // scroll up
        if (this._scrolling.enabled) {
            this.scrollDisplayPart(this._scrolling.lineStart, this._scrolling.lineEnd, 1);
        }
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

    },

    // device

    "c": function (sequence) { // report device code

        var code = 1;

        if (sequence === "\x1B[c") { // query device code
            this.TERMINAL.controller.terminalQuery("\x1B[" + code + "0c");
        } else {
            // @question Cache TERM does not reset settings
        }

    },

    "n": function (sequence, params) {

        switch (parseInt(params)) {
            case 5: { // query device status
                this.TERMINAL.controller.terminalQuery("\x1B[" + ( 1 ? 0 : 3 ) + "n");
            } break;
            case 6: { // query cursor position
                this.TERMINAL.controller.terminalQuery(
                    "\x1B[" + this.getCaretY() + ";" + this.getCaretX() + "R"
                );
            } break;
        }

    },

    // SCROLLING

    "r": function (sequence, params) {

        var codes;

        if (params) {
            codes = params.split(";").map(function(item) {
                return parseInt(item, 10);
            });
            if (codes.length > 1) {
                this.enableScrolling(codes[0], codes[1]);
            }
        } else {
            this.disableScrolling();
        }

    },

    // ERAZING

    "K": function (sequence, params) {

        if (params == 1) { // @tested OK
            this.getCurrentLine().writePlain(
                (new Array(this.getCaretX())).join(" "), 0
            );
        } else if (params == 2) { // @tested OK
            this.getCurrentLine().writePlain(
                (new Array(this.WIDTH + 1)).join(" "), 0
            );
        } else { // @tested OK
            this.getCurrentLine().writePlain(
                (new Array(this.WIDTH - this.getCaretX() + 2)).join(" "), this.getCaretX() - 1
            );
        }

    },

    "J": function (sequence, params) {

        var i;

        if (params == 1) {
            for (i = this.getCaretY() /* - 1 @question Cache TERM standard wrong? */; i > 0; i--) {
                this.getLineByCursorY(i).clear();
            }
        } else if (params == 2) {
            for (i = 1; i < this.WIDTH; i++) {
                this.getLineByCursorY(i).clear();
                /* @question Return to cursor home: Cache TERM standard wrong? */
            }
        } else {
            for (i = this.getCaretY() + 1; i < this.HEIGHT; i++) {
                this.getLineByCursorY(i).clear();
            }
        }

    }

};

/**
 * Scrolls the display down.
 *
 * @param {number} delta - Positive to scroll down.
 */
TerminalOutput.prototype.scrollDisplay = function (delta) {

    if (delta > 0) {
        this._TOP_LINE_INDEX += delta;
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
 * @param {string} [style] - Style attribute for tag.
 */
TerminalOutput.prototype.setGraphicRendition = function (index, style) {

    if (index === 0) {
        this.CURRENT_GRAPHIC_RENDITION = {};
    } else {
        this.CURRENT_GRAPHIC_RENDITION[index] = style ? {
            style: style
        } : index;
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

    for (u = this._lines.length; u <= this._TOP_LINE_INDEX; u++) {
        this._lines[u] = new TerminalOutputLine(this);
    }

    return this._lines[this._TOP_LINE_INDEX];

};

/**
 * Returns current line. New lines will be added if they does not exists.
 *
 * @returns {TerminalOutputLine}
 */
TerminalOutput.prototype.getCurrentLine = function () {

    return this.getLineByCursorY(this.getCaretY());

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
    return this._TOP_LINE_INDEX + this._caret.y - 1;
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
 * Get line object by it's index. This function MUST spawn lines if there's no line with such index.
 *
 * @param {number} index
 * @returns {TerminalOutputLine}
 */
TerminalOutput.prototype.getLineByIndex = function (index) {

    var u;

    for (u = this._lines.length; u <= index; u++) {
        this._lines[u] = new TerminalOutputLine(this);
    }

    return this._lines[index];

};

/**
 * @param {number} y
 * @returns {TerminalOutputLine}
 */
TerminalOutput.prototype.getLineByCursorY = function (y) {

    return this.getLineByIndex(this._TOP_LINE_INDEX + (y - 1));

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
    this._caret.y = line - this._TOP_LINE_INDEX + 1;
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

    var temp,
        temp2;

    if (!this._stack) return;

    // ? Wait for valid escape sequence.
    // This weird condition splits output stack so that valid escape sequences won't be separated.
    // In other words, this prevents printing beginning of sequence (for example, "<ESC>[0...") and
    // ending (f.e. "m") separately.
    // Also I believe that this technique can be improved. If you have any suggestions, please,
    // comment this out.
    if ((temp = this._stack.lastIndexOf(String.fromCharCode(27))) !== -1
        && (temp2 = (temp = this._stack.substring(temp, this._stack.length))
            .match(this.CONTROL_SEQUENCE_PATTERN)) && temp2[0] !== "\x1b[") {
        this._output(this._stack);
        this._stack = "";
    } else {
        this._output(this._stack.substring(0, this._stack.length - (temp.length || 0)));
        this._stack = temp===-1?"":temp;
    }
    this.scrollToActualLine();

};

/**
 * Clears output field.
 */
TerminalOutput.prototype.clear = function () {

    this.printSync();
    this._TOP_LINE_INDEX = this._lines.length;
    this._spawnLines(this.HEIGHT);
    this.scrollToActualLine();
    this.setCaretX(1);
    this.setCaretY(1);

};

/**
 * Scrolls terminal to _TOP_LINE_INDEX.
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
        lastProperty = this.TERMINAL.elements.output.style.overflowY,
        LR_MARGIN = 6;

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
            (this.TERMINAL.elements.terminal.offsetWidth - scrollBarWidth - LR_MARGIN)
                / this.SYMBOL_PIXEL_WIDTH
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