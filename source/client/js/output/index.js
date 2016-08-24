import { Line, LINE_CLASS_NAME } from "./Line";
import * as elements from "../elements";
import { onWindowLoad } from "../lib";
import { ESC_CHARS_MASK, applyEscapeSequence } from "./escStateMachine";
import esc from "./esc";
import { onInit } from "../init";

const LINE_UPDATE_TIMEOUT = 10;

export let SYMBOL_HEIGHT = 12; // in px
export let SYMBOL_WIDTH = 8; // in px
export let WIDTH = 0, // in symbols
           HEIGHT = 0;
export let LINE_WRAP_ENABLED = true; // todo

/**
 * Defines if scrolling is activated on the screen.
 * @type {{enabled: boolean, lineStart: number, lineEnd: number}}
 */
let scrolling = {
    enabled: false,
    lineStart: 1,
    lineEnd: 1
};

/**
 * Terminal ready flag.
 * @type {boolean}
 */
let INITIALIZED = false;

onInit(() => {
    INITIALIZED = true;
    freeStack();
});

/**
 * Output stack. Each output operation will be written to stack first.
 * @type {string}
 */
let stack = "";

/**
 * Object that includes current graphic rendition flag pairs [key, props].
 * [key, object, nextKey, object2, ...]
 * @type {(number|{[class]: string, [style]: string, [tag]: string, [attrs]: Object<string,*>[]})[]}
 */
export let GRAPHIC_PROPERTIES = [];

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

export function getLinesNumber () {
    return lines.length;
}

/**
 * Returns line index of the current caret position.
 * @returns {number}
 */
export function getCurrentLineIndex () {
    return getLineByCursorY(cursor.y).INDEX;
}

/**
 * Returns top line index.
 * @returns {number}
 */
export function getTopLineIndex () {
    return Math.max(lines.length - HEIGHT, 0);
}

/**
 * Sets the cursor Y to specified line. Does not apply cursor restrictions or limitations.
 * @param {number} index
 * @returns {boolean}
 */
export function setCursorYToLineIndex (index) {
    return setCursorY(index - getTopLineIndex() + 1, false);
}

/**
 * Holds the tab positions.
 * @type {Object.<number,boolean>}
 */
let tabs = [];

export function print (text) {

    stack += text;
    if (!INITIALIZED)
        return;
    freeStack();

}

export function printLine (text) {
    print(`${ text }\r\n`);
}

export function setTabAt (x) {
    for (let i = 0; i < tabs.length; i++) {
        if (x < tabs[i]) {
            tabs.splice(i, 0, x);
            return;
        } else if (x === tabs[i]) {
            return;
        }
    }
    tabs.push(x);
}

/**
 * Clear tabs. If position is not defined, clears all tabs.
 * @param {number} [x]
 */
export function clearTab (x) {
    let i;
    if (x) {
        if ((i = tabs.indexOf(x)) !== -1)
            tabs.splice(i, 1);
    } else {
        tabs = [];
    }
}

export function getTabs () {
    return tabs;
}

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
                //setGraphicProperties(38, "color: " + COLOR_8BIT[codes[i+2]]);
                i += 2;
            } else if (codes[i] === 48 && codes[i+1] === 5) {
                //setGraphicProperties(48, "background-color: " + COLOR_8BIT[codes[i+2]]);
                i += 2;
            } //else setGraphicProperties(codes[i] || 0);
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
                scrollDisplay(scrolling.lineStart, scrolling.lineEnd, -1);
            }
        }
    },

    "M": function () { // scroll up
        if (scrolling.enabled) {
            scrollDisplay(scrolling.lineStart, scrolling.lineEnd, 1);
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
        tabs.push(x); // setTabAt speed-up

});

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
    getLineByCursorY(cursor.y); // ensures line exists
    return y === cursor.y;
}

/**
 * Enables scrolling for display part.
 * @param {number} lineStart
 * @param {number} lineEnd
 */
export function enableScrolling (lineStart, lineEnd) {

    scrolling.enabled = true;
    scrolling.lineStart = Math.max(lineStart, 1);
    scrolling.lineEnd = Math.min(lineEnd, HEIGHT);
    setCursorX(1);
    setCursorY(1);

}

/**
 * Disables scrolling.
 */
export function disableScrolling () {

    scrolling.enabled = false;
    setCursorX(1);
    setCursorY(1);

}

/**
 * Scroll part of display. This function will erase lines that overflow scroll region.
 * @param {number} amount - 1 or -1. Positive number will scroll display UP.
 * todo: test
 */
export function scrollDisplay (amount) {

    let cy = getCursorY();

    if (
        !scrolling.enabled
        || !((scrolling.lineStart === cy && amount < 0) || (scrolling.lineEnd === cy && amount > 0))
    ) {
        if (cy + amount > HEIGHT) {
            pushLines(1);
        }
        setCursorY(cy + amount);
        return;
    }

    let TOP_LINE_INDEX = getTopLineIndex(),
        up = scrolling.lineStart === cy;

    getLineByIndex(TOP_LINE_INDEX + scrolling.lineEnd); // ensure that line exists

    let aliveLines = lines.slice(
        TOP_LINE_INDEX + scrolling.lineStart - 1, TOP_LINE_INDEX + scrolling.lineEnd
    );

    aliveLines[up ? "pop" : "shift"]().remove();
    for (let l of aliveLines)
        l.setIndex(l.INDEX + (up ? 1 : -1));
    aliveLines[up ? "unshift" : "push"](
        new Line(TOP_LINE_INDEX + (up ? scrolling.lineStart : scrolling.lineEnd) - 1)
    );
    lines.splice.apply(
        lines,
        [TOP_LINE_INDEX + scrolling.lineStart - 1, aliveLines.length].concat(aliveLines)
    );

}

/**
 * Sets the graphic property.
 * @param {number} key - The key of the property.
 * @param {Object} custom - Properties to assign.
 */
export function setGraphicProperty (key, custom = {}) {

    if (GRAPHIC_PROPERTIES.indexOf(+key) !== -1)
        clearGraphicProperty(+key);
    GRAPHIC_PROPERTIES.push(+key, {
        class: custom.class,
        style: custom.style,
        tag: custom.tag,
        attrs: custom.attrs
    });
    // console.log(`GP is now`, JSON.parse(JSON.stringify(GRAPHIC_PROPERTIES)));

}

export function clearGraphicProperty (key) {
    
    let i = GRAPHIC_PROPERTIES.indexOf(+key);
    if (i !== -1)
        GRAPHIC_PROPERTIES.splice(i, 2);
    // console.log(`GP is now`, JSON.parse(JSON.stringify(GRAPHIC_PROPERTIES)));
    
}

/**
 * Clears all previously assigned graphic properties.
 */
export function resetGraphicProperties () {
    GRAPHIC_PROPERTIES = [];
    // console.log(`GP is now`, JSON.parse(JSON.stringify(GRAPHIC_PROPERTIES)));
}

/**
 * Returns current line. New lines will be added if they does not exists.
 * @returns {Line}
 */
export function getCurrentLine () {

    return getLineByIndex(getTopLineIndex() + cursor.y - 1);

}

/**
 * Add empty lines to the bottom and update TOP_LINE_INDEX if necessary.
 * @param {number} number
 */
export function pushLines (number) {
    for (; number > 0; number--) {
        lines.push(new Line(lines.length));
    }
}

function freeStack () {

    if (!stack) return;
    
    let pos, oldStack;

    while ((pos = stack.search(ESC_CHARS_MASK)) !== -1) {
        // console.log(`Taking ${stack} (${ stack.split("").map(a => a.charCodeAt(0)) })`);
        output(stack.substring(0, pos));
        // console.log(`Outputting ${ pos } characters`);
        stack = applyEscapeSequence((oldStack = stack).substr(pos));
        // console.log(`After esc applied got ${stack} (${ stack.split("").map(a => a.charCodeAt(0)) })`);
        if (stack.length === oldStack.length)
            return; // wait for more characters
    }

    output(stack);
    stack = "";
    scrollDown();

}

let changedLines = {},
    lineUpdateTimeout = 0;

/**
 * Print plain text without stacking it.
 * @param {string} text
 */
export function immediatePlainPrint (text) {
    return output(text);
}

export function newLine () {
    esc["\r"](); esc["\n"]();
}

/**
 * Output plain text. Text must not include any non-printable characters.
 * @param {string=} plainText
 */
function output (plainText = "") {

    if (!plainText.length)
        return;

    let line, xDelta;

    do {

        line = getCurrentLine();

        xDelta = plainText.length;
        plainText = line.print(plainText, cursor.x - 1);
        changedLines[line.INDEX] = true;
        xDelta -= plainText.length;

        if (plainText) {
            esc["\r"](); esc["\n"]();
        } else if (!setCursorX(cursor.x + xDelta)) {
            esc["\r"](); esc["\n"]();
        }

    } while (plainText);

    if (lineUpdateTimeout !== 0)
        return;

    lineUpdateTimeout = setTimeout(() => {
        for (let line in changedLines) {
            if (lines[line])
                lines[line].render();
            delete changedLines[line];
        }
        lineUpdateTimeout = 0;
        scrollDown();
    }, LINE_UPDATE_TIMEOUT);

}

/**
 * Get line object by it's index. This function MUST spawn lines if there's no line with such index.
 *
 * @param {number} index
 * @returns {Line}
 */
function getLineByIndex (index) {

    var toPush = Math.max(index - lines.length + 1, 0);

    if (toPush > 0)
        pushLines(toPush);

    return lines[index];

}

/**
 * @param {number} y
 * @returns {Line}
 */
export function getLineByCursorY (y) {
    return getLineByIndex(getTopLineIndex() + (y - 1));
}

/**
 * Clears output field.
 */
export function clear () {
    scrollDisplay(1);
    let i = getTopLineIndex() + getCursorY() - 1,
        m = lines.length,
        r = m - i - 1,
        t = lines.length - getTopLineIndex();
    pushLines(Math.max(HEIGHT - r, t));
    setCursorX(1);
    setCursorY(1);
    scrollDown();
}

/**
 * Scrolls terminal window to actual view.
 */
export function scrollDown () {
    elements.output.scrollTop = getTopLineIndex() * SYMBOL_HEIGHT;
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
    testScrollbar.className = LINE_CLASS_NAME;

    elements.output.appendChild(testScrollbar);
    scrollBarWidth = elements.output.offsetWidth - testScrollbar.offsetWidth;
    elements.output.style.overflowY = lastOverflowProperty;

    tel.innerHTML = "XXXXXXXXXX";
    testScrollbar.appendChild(tel);

    SYMBOL_WIDTH = tel.offsetWidth / 10;
    SYMBOL_HEIGHT = tel.offsetHeight;

    WIDTH = Math.floor( (elements.terminal.offsetWidth - scrollBarWidth) / SYMBOL_WIDTH );
    HEIGHT = Math.floor( elements.terminal.offsetHeight / SYMBOL_HEIGHT );

    elements.input.style.width = `${ WIDTH * SYMBOL_WIDTH }px`;

    elements.output.removeChild(testScrollbar);
    
    // elements.output.style.width = `${ WIDTH * SYMBOL_WIDTH + scrollBarWidth }px`;
    // elements.output.style.height = `${ HEIGHT * SYMBOL_HEIGHT }px`; = 100%
    // console.log(`S W/H ${ SYMBOL_WIDTH }/${ SYMBOL_HEIGHT } ${ WIDTH }/${ HEIGHT }`);

}