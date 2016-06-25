import * as elements from "../elements";
import * as output from "../output";
import * as caret from "./caret";
import * as history from "./history";
import * as grammar from "../autocomplete/index";

export let ENABLED = false;

let ORIGIN_LINE_INDEX = 0,
    ORIGIN_CURSOR_X = 0,
    HINT = "";

let oldInputLength = 0,
    promptCallBack = null,
    readTimeout = 0,
    readLength = 0,
    updateHandlers = [],
    keyDownHandlers = [];

window.addEventListener(`keydown`, (e) => {
    focusInput();
    keyDown(e);
    e.stopPropagation();
}, true);
window.addEventListener(`click`, focusInput, true);
elements.input.addEventListener(`input`, () => {
    updateInput();
    inputUpdated();
});
elements.input.addEventListener(`keydown`, (e) => {
    keyDown(e);
    e.stopPropagation();
});
let lastMouseMoveSelection = [undefined, undefined];
elements.input.addEventListener(`mousemove`, () => {
    if (
        elements.input.selectionStart !== lastMouseMoveSelection[0]
        || elements.input.selectionEnd !== lastMouseMoveSelection[1]
    ) {
        lastMouseMoveSelection[0] = elements.input.selectionStart;
        lastMouseMoveSelection[1] = elements.input.selectionEnd;
        updateInput();
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

/**
 * Returns a code of a pressed key.
 * @param {{ [timeout]: number }} options - Timeout in seconds.
 * @param {function} callback
 */
export function getKey (options = {}, callback) {

    if (ENABLED)
        onSubmit();

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

function setCaretPosition(caretPos) {
    focusInput();
    if (elements.input.createTextRange) {
        var range = elements.input.createTextRange();
        range.move(`character`, caretPos);
        range.select();
    } else if (typeof elements.input.selectionStart !== "undefined") {
        elements.input.setSelectionRange(caretPos, caretPos);
    }
    console.log(`Caret position is set to ${ caretPos }!`);
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
            updateInput();
            inputUpdated();
        }, 1); // update in the next frame
    }
    if (e.keyCode === 38 || e.keyCode === 40) { // up || down
        elements.input.value = history.get(e.keyCode - 39);
        updateInput();
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

    hideInput();
    let char = String.fromCharCode(event.keyCode)[event.shiftKey ? "toUpperCase" : "toLowerCase"](),
        code = char.charCodeAt(0);
    if (code > 31)
        output.print(char);
    callback(code);

}

function showInput () {
    oldInputLength = 0;
    elements.input.value = "";
    elements.input.style.textIndent = `${ (ORIGIN_CURSOR_X - 1) * output.SYMBOL_WIDTH }px`;
    elements.input.style.top = `${ ORIGIN_LINE_INDEX * output.SYMBOL_HEIGHT }px`;
    elements.output.appendChild(elements.input);
    updateInput();
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
        updateInput();
}

function updateInput () {

    let extraLength = 0;

    if (!ENABLED)
        return;

    output.setCursorYToLineIndex(ORIGIN_LINE_INDEX);
    output.setCursorX(ORIGIN_CURSOR_X);
    if (
        typeof elements.input.selectionStart !== "undefined"
        && typeof elements.input.selectionEnd !== "undefined"
    ) {
        output.print(elements.input.value.substring(0, elements.input.selectionStart));
        let val = elements.input.value.substring(
            elements.input.selectionStart,
            elements.input.selectionEnd
        );
        if (val) {
            output.print(`\x1b[7m${ val }\x1b[0m`);
        }
        caret.update();
        if (HINT && !val) {
            output.print(`\x1b[(hint)m${ HINT }\x1b[0m`);
            extraLength = HINT.length;
        }
        output.print(elements.input.value.substring(
            elements.input.selectionEnd,
            elements.input.value.length
        ));
    }
    if (elements.input.value.length < oldInputLength) {// erase old characters
        output.print((new Array(oldInputLength - elements.input.value.length + 1)).join(" "));
    }
    oldInputLength = elements.input.value.length + extraLength;

    let h = (output.getCurrentLineIndex() - ORIGIN_LINE_INDEX + 1) * output.SYMBOL_HEIGHT;
    if (elements.input.style.height !== `${ h }px`)
        elements.input.style.height = `${ h }px`;

    if (ENABLED && readLength && elements.input.value.length >= readLength)
        onSubmit();

}

function onSubmit () {
    ENABLED = false;
    clearTimeout(readTimeout);
    readTimeout = 0;
    if (promptCallBack)
        promptCallBack(elements.input.value);
    history.push(elements.input.value);
    promptCallBack = null;
    hideInput();
}

function hideInput () {
    if (elements.input.parentNode)
        elements.input.parentNode.removeChild(elements.input);
    ENABLED = false;
    caret.hide();
}

/// @todo clean deprecated code below
/*
TerminalInput.prototype.complete = function () {

    var variant = this.getCurrentAutocompleteVariant(),
        caretPosition = this.getCaretPosition();

    if (!variant) return;

    this.set(this.get().splice(caretPosition, 0, variant));
    this.setCaretPosition(caretPosition + variant.length);
    this._onInput();

};

TerminalInput.prototype.getCurrentAutocompleteVariant = function () {

    return this._autocompleteVariants[this._currentAutocompleteVariant] || "";

};

TerminalInput.prototype._changeAutocompleteVariant = function (delta) {

    this._currentAutocompleteVariant = (this._currentAutocompleteVariant + delta)
        % this._autocompleteVariants.length || 0;
    if (this._currentAutocompleteVariant < 0) this._currentAutocompleteVariant
        += this._autocompleteVariants.length || 0;
    this._updateAutocompleteView();

};

TerminalInput.prototype._updateAutocompleteView = function () {

    var variant = this.getCurrentAutocompleteVariant();

    if (!variant) {
        this._autocompleteHint.hide();
        return;
    }

    this._autocompleteHint.show(
        (this.INITIAL_POSITION.position + this.getCaretPosition()) % this.TERMINAL.output.WIDTH + 1,
        this.INITIAL_POSITION.line + Math.floor(
            (this.INITIAL_POSITION.position + this.getCaretPosition())
            / this.TERMINAL.output.WIDTH),
        variant
    );

};

TerminalInput.prototype.clearAutocompleteVariants = function () {

    this._autocompleteVariants = [];
    this._currentAutocompleteVariant = 0;

};*/