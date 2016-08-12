import * as elements from "../elements";
import * as output from "../output";
import * as caret from "./caret";
import * as history from "./history";
import { Terminal, userInput } from "../index";
import { process as processString } from "../autocomplete";

export let ENABLED = false,
    PROMPT_CLEARED = false;

const SELECTION_CLASS = "selected";

let ORIGIN_LINE_INDEX = 0,
    ORIGIN_CURSOR_X = 0,
    PROMPT_START_LINE_INDEX = 0,
    PROMPT_START_CURSOR_X = 0,
    PROMPT_MESSAGE = "",
    PROMPT_OPTIONS = {},
    HINT = "",
    MODE = 0;

let oldInputLength = 0,
    promptCallBack = null,
    readTimeout = 0,
    readLength = 0,
    updateHandlers = [],
    keyDownHandlers = [];

window.addEventListener(`keydown`, (e) => {
    focusInput();
    keyDown(e);
    // e.stopPropagation();
}, true);
window.addEventListener(`click`, focusInput, true);
elements.input.addEventListener(`input`, () => {
    update();
    inputUpdated();
});
elements.input.addEventListener(`keydown`, (e) => {
    keyDown(e);
    // e.stopPropagation();
});
let lastMouseMoveSelection = [undefined, undefined];
elements.input.addEventListener(`mousemove`, () => {
    if (
        elements.input.selectionStart !== lastMouseMoveSelection[0]
        || elements.input.selectionEnd !== lastMouseMoveSelection[1]
    ) {
        lastMouseMoveSelection[0] = elements.input.selectionStart;
        lastMouseMoveSelection[1] = elements.input.selectionEnd;
        update();
    }
});

export function focusInput () {
    if (!ENABLED)
        return false;
    if (document.getSelection().toString() !== "")
        return false;
    if (document.activeElement !== elements.input) {
        elements.input.focus();
        return true;
    }
    return false;
}

/**
 * Prompts user to enter text.
 * @param {string} text - String, which will be printed before prompt.
 * @param {{ [timeout]: number, [length]: number }} options - Timeout in seconds.
 * @param {function} callback
 */
export function prompt (text, options = {}, callback) {

    MODE = text ? Terminal.prototype.MODE_PROMPT : Terminal.prototype.MODE_READ;
    PROMPT_START_CURSOR_X = output.getCursorX();
    PROMPT_START_LINE_INDEX = output.getCurrentLineIndex();
    PROMPT_MESSAGE = text || "";
    PROMPT_OPTIONS = options;
    PROMPT_CLEARED = false;

    if (text)
        output.print(text);
    
    ENABLED = true;
    ORIGIN_CURSOR_X = output.getCursorX();
    ORIGIN_LINE_INDEX = output.getCurrentLineIndex();
    if (typeof callback === `function`)
        promptCallBack = callback;
    clearTimeout(readTimeout);
    if (options.timeout)
        readTimeout = setTimeout(onSubmit, options.timeout * 1000);
    readLength = options.length ? options.length : 0;
    showInput();

}

export function clearPrompt () {
    if (!ENABLED)
        return;
    output.setCursorYToLineIndex(PROMPT_START_LINE_INDEX);
    output.setCursorX(PROMPT_START_CURSOR_X);
    output.immediatePlainPrint(
        new Array(PROMPT_MESSAGE.length + elements.input.value.length + 1).join(" ")
    );
    output.setCursorYToLineIndex(PROMPT_START_LINE_INDEX);
    output.setCursorX(PROMPT_START_CURSOR_X);
    PROMPT_CLEARED = true;
}

/**
 * Performs the last prompt
 */
export function reprompt () {
    if (!ENABLED)
        return;
    prompt(PROMPT_MESSAGE, PROMPT_OPTIONS, promptCallBack);
}

/**
 * Returns a code of a pressed key.
 * @param {{ [timeout]: number }} options - Timeout in seconds.
 * @param {function} callback
 */
export function getKey (options = {}, callback) {

    if (ENABLED)
        onSubmit();

    MODE = Terminal.prototype.MODE_READ_CHAR;

    // for mobile devices the keyboard needs to appear
    showInput();
    focusInput();
    caret.hide();

    let inp = (e) => {
        if (handleKeyPress(e, callback) === false)
            return;
        window.removeEventListener(`keydown`, inp);
    };
    window.addEventListener(`keydown`, inp);
    clearTimeout(readTimeout);
    if (options.timeout) {
        readTimeout = setTimeout(() => {
            readTimeout = 0;
            window.removeEventListener(`keydown`, inp);
            hideInput();
            callback(-1);
        }, options.timeout * 1000);
    }

}

export function setCaretPosition (caretPos) {
    focusInput();
    if (elements.input.createTextRange) {
        var range = elements.input.createTextRange();
        range.move(`character`, caretPos);
        range.select();
    } else if (typeof elements.input.selectionStart !== "undefined") {
        elements.input.setSelectionRange(caretPos, caretPos);
    }
}

export function getCaretPosition () {
    if (typeof elements.input.selectionEnd !== "undefined") {
        return elements.input.selectionEnd;
    } else if (document.selection && document.selection.createRange) {
        return document.selection.createRange().getBookmark().charCodeAt(2) - 2;
    }
    return elements.input.length;
}

function keyDown (e) {
    if (!ENABLED)
        return;
    if (e.keyCode === 13) { // enter
        e.preventDefault();
        onSubmit();
        return;
    }
    if ([35, 36, 37, 39].indexOf(e.keyCode) !== -1) { // end home left right
        setTimeout(() => {
            update();
            inputUpdated();
        }, 1); // update in the next frame
    }
    if (e.keyCode === 38 || e.keyCode === 40) { // up || down
        elements.input.value = history.get(e.keyCode - 39);
        update();
        inputUpdated();
        setTimeout(() => setCaretPosition(elements.input.value.length), 1);
    }
    keyDownHandlers.forEach(h => h(e));
}

export function onKeyDown (handler) {
    keyDownHandlers.push(handler);
}

/**
 * This function must call callback function with appropriate key code value.
 * @param {Event} event
 * @param {function} callback
 */
function handleKeyPress (event, callback) {

    event.stopPropagation();
    event.preventDefault();

    if ([16, 17, 18].indexOf(event.keyCode) !== -1) // shift, ctrl, alt
        return false;

    let char = String.fromCharCode(event.keyCode)[event.shiftKey ? "toUpperCase" : "toLowerCase"](),
        code = char.charCodeAt(0),
        mode = MODE;
    hideInput();
    if (code > 31)
        output.print(char);
    userInput(String.fromCharCode(code), mode);
    callback(code);

}

function showInput () {
    oldInputLength = 0;
    elements.input.value = "";
    elements.input.style.textIndent = `${ (ORIGIN_CURSOR_X - 1) * output.SYMBOL_WIDTH }px`;
    elements.input.style.top = `${ ORIGIN_LINE_INDEX * output.SYMBOL_HEIGHT }px`;
    elements.output.appendChild(elements.input);
    update();
}

function inputUpdated () {
    updateHandlers.forEach((h) => h(elements.input.value, elements.input.selectionStart));
}

export function onUpdate (handler) {
    updateHandlers.push(handler);
}

export function setHint (string) {
    let oldHint = HINT;
    HINT = string;
    if (HINT !== oldHint)
        update();
}

export function update () {

    if (!ENABLED)
        return;

    output.setCursorYToLineIndex(ORIGIN_LINE_INDEX);
    output.setCursorX(ORIGIN_CURSOR_X);

    let selStart = typeof elements.input.selectionStart === "undefined" // some old browsers
            ? elements.input.value.length // can be improved with something like getCaretPos() f-n
            : elements.input.selectionStart,
        selEnd = typeof elements.input.selectionEnd === "undefined"
            ? elements.input.value.length
            : elements.input.selectionEnd,
        selLen = selEnd - selStart,
        { lexemes } = processString(elements.input.value, selStart),
        printedLength = 0, printingClass = "";

    for (let i = 0; i < lexemes.length; i++) {
        let inSelStart = printedLength <= selStart && selStart < printedLength + lexemes[i].value.length,
            inSelEnd = printedLength <= selEnd && selEnd < printedLength + lexemes[i].value.length;
        if (lexemes[i].class !== printingClass) {
            printingClass = lexemes[i].class;
            if (!(selLen > 0 && selStart < printedLength && printedLength < selEnd))
                output.print(`\x1B[${ printingClass === "" ? 0 : "(" + printingClass + ")" }m`);
        }
        if (inSelStart) {
            output.print(lexemes[i].value.substring(0, selStart - printedLength));
            caret.update();
            if (selLen > 0)
                output.print(`\x1B[(${ SELECTION_CLASS })m`);
        }
        if (inSelEnd) {
            output.print(lexemes[i].value.substring(inSelStart ? selStart - printedLength : 0, selEnd - printedLength));
        } else if (inSelStart) {
            output.print(lexemes[i].value.substr(selStart - printedLength));
        }
        if (inSelEnd) {
            if (selLen > 0)
                output.print(`\x1B[${ printingClass === "" ? 0 : "(" + printingClass + ")" }m`);
            output.print(lexemes[i].value.substr(selEnd - printedLength));
        }
        if (!inSelStart && !inSelEnd)
            output.print(lexemes[i].value);
        printedLength += lexemes[i].value.length;
    }
    if (selStart === printedLength)
        caret.update();
    if (printingClass)
        output.print(`\x1B[0m`);

    if (printedLength < oldInputLength) {// erase old characters
        output.print((new Array(oldInputLength - printedLength + 1)).join(" "));
    }
    oldInputLength = printedLength;

    let h = (output.getCurrentLineIndex() - ORIGIN_LINE_INDEX + 1) * output.SYMBOL_HEIGHT;
    if (elements.input.style.height !== `${ h }px`)
        elements.input.style.height = `${ h }px`;

    if (ENABLED && readLength && elements.input.value.length >= readLength)
        onSubmit();

}

function onSubmit () {
    let value = elements.input.value, // value may change during userInput() call, keep on top
        mode = MODE;
    hideInput();
    ENABLED = false;
    clearTimeout(readTimeout);
    readTimeout = 0;
    userInput(value, mode);
    if (promptCallBack)
        promptCallBack(value);
    history.push(value);
    promptCallBack = null;
}

function hideInput () {
    MODE = 0;
    if (elements.input.parentNode)
        elements.input.parentNode.removeChild(elements.input);
    ENABLED = false;
    caret.hide();
}
