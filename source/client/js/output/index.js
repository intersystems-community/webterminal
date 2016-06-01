import { Line, LINE_CLASS_NAME } from "./Line";
import * as elements from "../elements";
import { onWindowLoad } from "../lib";
import { COLOR_8BIT } from "./const";

export let SYMBOL_HEIGHT = 12; // in px
export let SYMBOL_WIDTH = 8; // in px
export let WIDTH = 0, // in symbols
           HEIGHT = 0;

/**
 * Regular expression that must match any control symbols such as "\r" or "\n" and escape
 * sequences.
 * @type {RegExp}
 */
let CONTROL_SEQUENCE_PATTERN = /[\x00-\x1A]|\x1b\[?[^@-~]*[@-~]/g;

/**
 * When printing a lot of text, terminal may freeze and become unresponsive. To prevent this,
 * writing a big string, or a frequent write will trigger a little delay in printing to draw
 * contents on the screen.
 * @type {number}
 */
/*let PRINT_INTERRUPT_TIMEOUT = 25,
    printScore = 0,
    interruptTimeout = 0;*/

/**
 * Output stack. Each output operation will be written to stack first.
 * @type {string}
 */
let stack = "";

/**
 * Terminal output are based on lines of rendered text. This variable shows which line number
 * will define Y = 1 caret position.
 * @type {number}
 */
let TOP_LINE_INDEX = 0;

/**
 * Object that includes current graphic rendition flags as a key.
 * @type {{number: boolean}}
 */
let CURRENT_GRAPHIC_RENDITION = {};

/**
 * Array of Line instances currently on the screen.
 * @type {Line[]}
 */
let lines = [];

/**
 * Caret position.
 * @type {{x: number, y: number}}
 */
let cursor = {
    x: 1,
    y: 1
};

/**
 * @returns {number}
 */
export function getCursorX () {
    return cursor.x;
}

/**
 * @returns {number}
 */
export function getCursorY () {
    return cursor.y;
}

/**
 * Returns line index of the current caret position.
 * @returns {number}
 */
export function getCurrentLineIndex () {
    return getLineByCursorY(cursor.y).INDEX;
}

/**
 * Sets the cursor Y to specified line. Does not apply cursor restrictions or limitations.
 * @param {number} index
 * @returns {boolean}
 */
export function setCursorYToLineIndex (index) {
    return setCursorY(index - TOP_LINE_INDEX + 1, false);
}

/**
 * Defines if scrolling is activated on the screen.
 * @type {{enabled: boolean, lineStart: number, lineEnd: number}}
 */
let scrolling = {
    enabled: false,
    lineStart: 0,
    lineEnd: 0
};

/**
 * Holds the tab positions.
 * @type {Object.<number,boolean>}
 */
let tabs = {};

/**
 * When enabled, caret position will be limited in [1, WIDTH] by X and [1, HEIGHT] by Y axis.
 *
 * This enables terminal to print content out of it's viewport.
 *
 * MAKE SURE TO SET "true" VALUE BACK IN THE SAME CODE SCOPE WHEN USED.
 *
 * @type {boolean} flag
 * @deprecated
 */
let $CARET_RESTRICTION_ON = true;

export function print (text) {

    stack += text;
    freeStack();

}

window.print = print; // todo: remove after test

export function printLine (text) {
    print(`${ text }\r\n`);
}

export function getGraphicRendition () {
    return CURRENT_GRAPHIC_RENDITION; // @todo
}

/**
 * This object handles implementation of control characters in range \x00..\x1F.
 * @private
 */
const CONTROL_CHARACTERS = {

    "\x00": function () {

    },

    // \t
    "\x09": function () {

        var x = getCursorX();

        for (; x < WIDTH; x++) {
            if (tabs.hasOwnProperty(x.toString())) {
                setCursorX(x);
                break;
            }
        }

    },

    // \n
    "\x0A": function () {

        if (scrolling.enabled && cursor.y === scrolling.lineEnd) {
            scrollDisplayPart(scrolling.lineStart, scrolling.lineEnd, 1);
        } else {
            if (cursor.y === HEIGHT) {
                scrollDisplay(1);
            }
            setCursorY(cursor.y + 1);
        }

    },

    // \r
    "\x0D": function () {

        setCursorX(1);

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
const CONTROL_SEQUENCES = {

    // GRAPHIC CONTROL

    "m": function (sequence, params) {

        var codes = params.split(";").map((item) => {
                return parseInt(item, 10); // CWTv4 refactoring: 10?
            }),
            i;

        for (i = 0; i < codes.length; i++) {
            if (codes[i] === 38 && codes[i+1] === 5) {
                setGraphicRendition(38, "color: " + COLOR_8BIT[codes[i+2]]);
                i += 2;
            } else if (codes[i] === 48 && codes[i+1] === 5) {
                setGraphicRendition(48, "background-color: " + COLOR_8BIT[codes[i+2]]);
                i += 2;
            } else setGraphicRendition(codes[i] || 0);
        }

    },

    // CURSOR CONTROL

    "A": function (sequence, params) {
        setCursorY(getCursorY() - (parseInt(params) || 1));
    },

    "B": function (sequence, params) {
        setCursorY(getCursorY() + (parseInt(params) || 1));
    },

    "C": function (sequence, params) {
        setCursorX(getCursorX() + (parseInt(params) || 1));
    },

    "D": function (sequence, params) {
        if (sequence.charAt(1) === "[") {
            setCursorX(getCursorX() - (parseInt(params) || 1));
        } else { // scroll down
            if (scrolling.enabled) {
                scrollDisplayPart(scrolling.lineStart, scrolling.lineEnd, -1);
            }
        }
    },

    "M": function () { // scroll up
        if (scrolling.enabled) {
            scrollDisplayPart(scrolling.lineStart, scrolling.lineEnd, 1);
        }
    },

    "f": function (sequence, params) {

        var positions = params.split(";");

        setCursorX(parseInt(positions[1] || 1));
        setCursorY(parseInt(positions[0] || 1));

    },

    "H": function (sequence, params) {

        if (sequence.charAt(1) === "[") {
            CONTROL_SEQUENCES.f.call(this, sequence, params);
        } else {
            setTab(getCursorX());
        }

    },

    // TAB CONTROL

    "g": function (sequence, params) {

        if (params === "3") {
            clearTab();
        } else {
            clearTab(getCursorX());
        }

    },

    "G": function (sequence, params) {

        setCursorX(parseInt(params) || 1);

    },

    // device

    "c": function (sequence) { // report device code

        var code = 1;

        if (sequence === "\x1B[c") { // query device code
            this.TERMINAL.controller.terminalQuery("\x1B[" + code + "0c"); // todo: send to server
        } else {
            // @question Cache TERM does not reset settings
        }

    },

    "n": function (sequence, params) {

        switch (parseInt(params)) {
            case 5: { // query device status
                // todo: send to server
                this.TERMINAL.controller.terminalQuery("\x1B[" + ( 1 ? 0 : 3 ) + "n");
            } break;
            case 6: { // query cursor position
                this.TERMINAL.controller.terminalQuery( // todo: send to server
                    "\x1B[" + getCursorY() + ";" + getCursorX() + "R"
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
                enableScrolling(codes[0], codes[1]);
            }
        } else {
            disableScrolling();
        }

    },

    // ERAZING

    "K": function (sequence, params) {

        if (params == 1) { // @tested OK
            getCurrentLine().writePlain((new Array(getCursorX())).join(" "), 0);
        } else if (params == 2) { // @tested OK
            getCurrentLine().writePlain((new Array(WIDTH + 1)).join(" "), 0);
        } else { // @tested OK
            getCurrentLine().writePlain(
                (new Array(WIDTH - getCursorX() + 2)).join(" "), getCursorX() - 1
            );
        }

    },

    "J": function (sequence, params) {

        var i;

        if (params == 1) {
            for (i = getCursorY() /* - 1 @question Cache TERM standard wrong? */; i > 0; i--) {
                getLineByCursorY(i).clear();
            }
        } else if (params == 2) {
            for (i = 1; i < WIDTH; i++) {
                getLineByCursorY(i).clear();
                /* @question Return to cursor home: Cache TERM standard wrong? */
            }
        } else {
            for (i = getCursorY() + 1; i < HEIGHT; i++) {
                getLineByCursorY(i).clear();
            }
        }

    }

};

onWindowLoad(() => {

    window.addEventListener(`resize`, sizeChanged);

    sizeChanged();

    // set initial tabs
    for (let x = 9; x < WIDTH; x += 8)
        setTab(x);

});

/**
 * Set tab in position x.
 * @param {number} x
 */
function setTab (x) {
    tabs[x] = true;
}

/**
 * Clear tabs. If position is not defined, clears all tabs.
 * @param {number} [position]
 */
function clearTab (position) {
    if (position) {
        delete tabs[position];
    } else {
        tabs = {};
    }
}

/**
 * Sets caret X position. Caret position is limited by terminal output size.
 * @param {number} x
 * @returns {boolean} - If position wasn't limited and now equal to X.
 */
export function setCursorX (x) {
    cursor.x = Math.max(1, Math.min(WIDTH, x));
    return x === cursor.x;
}

/**
 * Sets caret Y position. Caret position is limited by terminal output size.
 * @param {number} y
 * @param {boolean=true} restrict
 * @returns {boolean} - If position wasn't limited and now equal to Y.
 */
export function setCursorY (y, restrict = true) {
    cursor.y = restrict ? Math.max(1, Math.min(HEIGHT, y)) : y;
    return y === cursor.y;
}

/**
 * Increase _TOP_LINE_INDEX for given amount. Use this function if only you know what are you doing.
 * @deprecated
 * @param {number} delta
 */
function increaseTopLine (delta) {
    TOP_LINE_INDEX += Math.round(delta);
    if (TOP_LINE_INDEX < 0) {
        TOP_LINE_INDEX = 0;
        console.warn("_TOP_LINE_INDEX = 0 bottom restriction applied.");
    }
}

/**
 * Enables scrolling for display part.
 * @param {number} lineStart
 * @param {number} lineEnd
 */
function enableScrolling (lineStart, lineEnd) {

    if (lineEnd > HEIGHT || lineStart < 1 || lineEnd < lineStart) {
        console.warn("Wrong scrolling borders: ", lineStart, lineEnd);
        return;
    }

    scrolling.enabled = true;
    scrolling.lineStart = lineStart;
    scrolling.lineEnd = lineEnd;
    setCursorX(1);
    setCursorY(1);

}

/**
 * Disables scrolling.
 */
function disableScrolling () {

    scrolling.enabled = false;

}

/**
 * Scroll part of display. This function will erase lines that overflow scroll region.
 * @param {number} lineFrom - Home line is 1.
 * @param {number} lineTo - Home line is 1.
 * @param {number} amount - Positive number will scroll display UP.
 * todo: test
 */
function scrollDisplayPart (lineFrom, lineTo, amount) {

    getLineByIndex(TOP_LINE_INDEX + lineTo); // ensure that line exists
    
    let newLine,
        affectiveLines = lines.slice(
            TOP_LINE_INDEX + lineFrom - 1, TOP_LINE_INDEX + lineTo
        ),
        len = affectiveLines.length,
        aliveLines = affectiveLines.
            slice(Math.min(Math.max(0, amount), len), Math.max(Math.min(len, len + amount), 0)),
        linesToAppend = affectiveLines.length - aliveLines.length,
        i,
        affectedLines;

    for (i = 0; i < linesToAppend; i++) { // lines to append === lines to kill
        affectiveLines[amount > 0 ? "shift" : "pop"]().remove();
    }

    for (i = 0; i < linesToAppend; i++) {
        aliveLines[amount > 0 ? "push" : "unshift"].call(
            aliveLines,
            newLine = new Line(TOP_LINE_INDEX + lineFrom - 1 - Math.sign(amount)*i) // todo: fix
        );
    }

    lines.splice.apply(lines,
        affectedLines = [TOP_LINE_INDEX + lineFrom - 1, aliveLines.length].concat(aliveLines)
    );
    
    affectedLines.forEach((line, i) => line.setIndex(TOP_LINE_INDEX + lineFrom - 1 + i));

}

/**
 * Scrolls the display down.
 * @param {number} delta - Positive to scroll down.
 */
function scrollDisplay (delta) {

    if (delta > 0) {
        TOP_LINE_INDEX += delta;
    } else {
        console.warn("Scroll up is not currently implemented. PLease, consult with author.");
    }

}

/**
 * Sets the graphic rendition index. Giving no arguments will clear any present indexes.
 * @param {number} [index]
 * @param {string} [style] - Style attribute for tag.
 */
function setGraphicRendition (index, style) {

    if (!index) {
        CURRENT_GRAPHIC_RENDITION = {};
    } else {
        CURRENT_GRAPHIC_RENDITION[index] = style ? {
            style: style
        } : index;
    }

}

/**
 * Sequence parsing and performing.
 * @param {string} sequence - Must include only one sequence.
 */
function applyControlSequence (sequence) {

    var i, letter;

    if (i = sequence.match(/[\x00-\x1A]/)) {

        if (CONTROL_CHARACTERS.hasOwnProperty(i[0])) {
            CONTROL_CHARACTERS[i[0]].call(this);
        }

    } else if (i = sequence.match(/\x1b\[?([^@-~]*)([@-~])/)) {

        letter = i[2];

        if (CONTROL_CHARACTERS.hasOwnProperty(letter)) {
            CONTROL_CHARACTERS[letter].call(this, i[0], i[1]);
        }

    }

}

/**
 * @returns {Line}
 */
function getTopLine () {

    var u;

    for (u = lines.length; u <= TOP_LINE_INDEX; u++) {
        lines[u] = new Line(u);
    }

    return lines[TOP_LINE_INDEX];

}

/**
 * Returns current line. New lines will be added if they does not exists.
 * @returns {Line}
 */
function getCurrentLine () {

    return getLineByCursorY(getCursorY());

}

/**
 * Outputs new line.
 */
function newLineSequence () {

    // do not flip to .print - may cause recursion. || change _outPlainText
    applyControlSequence("\r");
    applyControlSequence("\n");

}

/**
 * Add empty lines to the end of terminal output.
 * @param {number} number
 */
function spawnLines (number) {

    for (; number > 0; number--) {
        lines.push(new Line(lines.length));
    }

}

/**
 * Outputs plain text to caret position (x;y) to terminal output.
 * @param {string} string - String of plain text. This MUST NOT include any control characters.
 * @private
 */
function printPlainText (string) {

    var line, xDelta;

    do {

        line = getCurrentLine();

        xDelta = string.length;
        string = line.writePlain(string, cursor.x - 1);
        xDelta -= string.length;

        if (string) {
            newLineSequence();
        } else if (!setCursorX(cursor.x + xDelta)) {
            newLineSequence();
        }

    } while (string);

}

/**
 * Output and parse text with control symbols.
 * @param {string=} text
 */
function output (text = "") {

    var textOrigin = text,
        lastIndex = 0,
        textLeft;

    text.replace(CONTROL_SEQUENCE_PATTERN, (part, index, str) => {
        let beforePart = str.substring(lastIndex, index);
        if (!lastIndex) textOrigin = str;
        lastIndex = index + part.length;
        if (beforePart) printPlainText(beforePart);
        applyControlSequence(part);
        return "";
    });

    textLeft = textOrigin.substring(lastIndex, textOrigin.length);

    if (textLeft)
        printPlainText(textLeft);

}

/**
 * Get line object by it's index. This function MUST spawn lines if there's no line with such index.
 *
 * @param {number} index
 * @returns {Line}
 */
function getLineByIndex (index) {

    var u;

    for (u = lines.length; u <= index; u++) {
        lines[u] = new Line(u);
    }

    return lines[index];

}

/**
 * @param {number} y
 * @returns {Line}
 */
function getLineByCursorY (y) {

    return getLineByIndex(TOP_LINE_INDEX + (y - 1));

}

/**
 * May print text out-of-terminal (by Y axis). Synchronous operation.
 *
 * @param {string} text
 * @param {number} line
 * @param {number} position
 * @param {boolean=true} restrictCaret - restrict caret position to terminal window at end.
 */
function printAtLine (text, line, position, restrictCaret) {

    var lastRestriction = $CARET_RESTRICTION_ON;

    if (typeof restrictCaret === "undefined") restrictCaret = true;

    $CARET_RESTRICTION_ON = false;
    cursor.x = position + 1;
    cursor.y = line - TOP_LINE_INDEX + 1;
    printSync(text);

    if (restrictCaret) { // limit caret again
        $CARET_RESTRICTION_ON = true;
        setCursorX(getCursorX());
        setCursorY(getCursorY());
    }

    $CARET_RESTRICTION_ON = lastRestriction;

}

/**
 * Writing output to object immediately.
 *
 * @param {string} [text]
 */
function printSync (text) {

    freeStack();
    print(text || "");
    freeStack();

}

function freeStack () {

    var temp,
        temp2;

    if (!stack) return;

    // ? Wait for valid escape sequence.
    // This weird condition splits output stack so that valid escape sequences won't be separated.
    // In other words, this prevents printing beginning of sequence (for example, "<ESC>[0...") and
    // ending (f.e. "m") separately.
    // Also I believe that this technique can be improved. If you have any suggestions, please,
    // comment on this.
    if ((temp = stack.lastIndexOf(String.fromCharCode(27))) !== -1
        && (temp2 = stack.substring(temp, stack.length)
            .match(CONTROL_SEQUENCE_PATTERN)) && temp2[0] !== "\x1b[") {
        output(stack);
        stack = "";
    } else {
        output(stack.substring(0, stack.length - (temp.length || 0)));
        stack = temp === -1 ? "" : temp2;
    }
    scrollDown();

}

/**
 * Clears output field.
 */
export function clear () {

    printSync();
    TOP_LINE_INDEX = lines.length;
    spawnLines(HEIGHT);
    scrollDown();
    setCursorX(1);
    setCursorY(1);

}

/**
 * Scrolls terminal to _TOP_LINE_INDEX.
 */
export function scrollDown () {
    elements.output.scrollTop = TOP_LINE_INDEX * SYMBOL_HEIGHT + SYMBOL_HEIGHT;
}

/**
 * Window size change handler. Recalculates terminal sizes.
 * Changes WIDTH and HEIGHT constants and resize output.
 */
function sizeChanged () {

    var tel = document.createElement("span"),
        testScrollbar = document.createElement("div"),
        scrollBarWidth,
        lastOverflowProperty = elements.output.style.overflowY;

    elements.output.style.overflowY = "scroll";

    elements.output.appendChild(testScrollbar);
    scrollBarWidth = elements.output.offsetWidth - testScrollbar.offsetWidth;
    elements.output.style.overflowY = lastOverflowProperty;

    tel.className = LINE_CLASS_NAME;
    tel.innerHTML = "XXXXXXXXXX";
    testScrollbar.appendChild(tel);

    SYMBOL_WIDTH = tel.offsetWidth / 10;
    SYMBOL_HEIGHT = tel.offsetHeight;

    WIDTH = Math.floor( (elements.terminal.offsetWidth - scrollBarWidth) / SYMBOL_WIDTH );
    HEIGHT = Math.floor( elements.terminal.offsetHeight / SYMBOL_HEIGHT );

    elements.output.style.width = `${ WIDTH * SYMBOL_WIDTH + scrollBarWidth }px`;
    //elements.output.style.height = `${ HEIGHT * SYMBOL_HEIGHT }px`; = 100%

    elements.output.removeChild(testScrollbar);

    console.log(`S W/H ${ SYMBOL_WIDTH }/${ SYMBOL_HEIGHT } ${ WIDTH }/${ HEIGHT }`);

}