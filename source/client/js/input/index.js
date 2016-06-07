import * as elements from "../elements";
import * as output from "../output";
import * as caret from "./caret";

export let ENABLED = false;

let ORIGIN_LINE_INDEX = 0,
    ORIGIN_CURSOR_X = 0;

let oldInputLength = 0,
    promptCallBack = null,
    readTimeout = 0,
    readLength = 0;

window.addEventListener(`keydown`, (e) => {
    if (!ENABLED)
        return;
    if (focusInput() && e.keyCode === 13) {
        onSubmit();
    }
}, true);
window.addEventListener(`click`, focusInput, true);
elements.input.addEventListener(`input`, updateInput);
elements.input.addEventListener(`keydown`, (e) => {
    // console.log(e.keyCode);
    if (e.keyCode === 13) { // enter
        e.preventDefault();
        onSubmit();
    }
});
elements.input.addEventListener(`keyup`, (e) => {
    if ([8, 46, 37, 39].indexOf(e.keyCode) !== -1) { // del backspace left right
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
    elements.input.style.textIndent = `${ ORIGIN_CURSOR_X * output.SYMBOL_WIDTH }px`;
    elements.input.style.top = `${ ORIGIN_LINE_INDEX * output.SYMBOL_HEIGHT }px`;
    elements.output.appendChild(elements.input);
    updateInput();
}

function updateInput () {

    if (!ENABLED)
        return;

    output.setCursorYToLineIndex(ORIGIN_LINE_INDEX);
    output.setCursorX(ORIGIN_CURSOR_X);
    if (elements.input.selectionStart !== undefined && elements.input.selectionEnd !== undefined) {
        output.print(elements.input.value.substring(0, elements.input.selectionStart));
        let val = elements.input.value.substring(
            elements.input.selectionStart,
            elements.input.selectionEnd
        );
        if (val) {
            console.log(`Selected: `, val);
            output.print(`\x1b[7m${ val }\x1b[0m`);
        }
        caret.update();
        output.print(elements.input.value.substring(
            elements.input.selectionEnd,
            elements.input.value.length
        ));
    }
    if (elements.input.value.length < oldInputLength) {// erase old characters
        output.print((new Array(oldInputLength - elements.input.value.length + 1)).join(" "));
    }
    oldInputLength = elements.input.value.length;

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
    promptCallBack = null;
    hideInput();
}

function hideInput () {
    if (elements.input.parentNode)
        elements.input.parentNode.removeChild(elements.input);
    ENABLED = false;
    caret.hide();
}

/// @todo REMOVE DEPRECATED CODE BELOW

/**
 * Terminal input controller.
 *
 * @see TerminalElements.input
 * @param {Terminal} TERMINAL
 * @constructor
 */
var TerminalInput = function () {

    /**
     * Variants of autocompletion.
     *
     * @see TerminalInput._onInput - Updating.
     * @type {string[]}
     */
    this._autocompleteVariants = [];

    /**
     * @type {number}
     * @private
     */
    this._currentAutocompleteVariant = 0;

    /**
     * @type {TerminalHint}
     * @private
     */
    this._autocompleteHint = new TerminalHint(this.TERMINAL);

    /**
     * Variable that indicates last length of input to determine if text was erased.
     *
     * @see this.prototype._onInput
     * @type {number}
     * @private
     */
    this.__inputLastLength = 0;

    /**
     * If defined, input will be handled by function when submit.
     *
     * @type {function}
     * @private
     */
    this._handler = null;

    /**
     * @type {boolean}
     * @private
     */
    this.__readingChar = false;

    /**
     * Shows the input beginning position.
     *
     * @type {{line: number, position: number}}
     */
    this.INITIAL_POSITION = {
        line: 0,
        position: 0
    };

    this.initialize();

};

TerminalInput.prototype.initialize = function () {

    var _this = this;

    window.addEventListener("keypress", function () { // PC devices
        // activeElement can be HTMLInputElement
        // noinspection JSValidateTypes
        if (_this.ENABLED && document.activeElement !== _this.TERMINAL.elements.input) {
            _this.focus();
        }
    });

    this.TERMINAL.elements.terminal.addEventListener("touchend", function (event) { // touch devices
        if (_this.ENABLED && document.getSelection().isCollapsed) { // enabled & no selection
            event.preventDefault();
            _this.focus();
        }
    });

    this.TERMINAL.elements.input.addEventListener("input", function () {
        if (_this.ENABLED) {
            _this._onInput();
        }
    });

    this.TERMINAL.elements.input.addEventListener("keydown", function (event) {
        if (_this.ENABLED) {
            _this.keyDown(event);
        }
    });

};

/**
 * Focus on input.
 */
TerminalInput.prototype.focus = function () {
    this.TERMINAL.elements.input.blur();
    this.TERMINAL.elements.input.focus();
};

/**
 * Sets the terminal input string.
 * @param {string} text
 */
TerminalInput.prototype.set = function (text) {

    var element = this.TERMINAL.elements.input;

    element.value = text;
    this.setCaretPosition(element.value.length);
    this._onInput();

};

/**
 * Enable input.
 *
 * @private
 */
TerminalInput.prototype._enable = function () {

    this.ENABLED = true;
    this.TERMINAL.elements.input.removeAttribute("disabled");
    this.focus();
    this.caret.update();

};

/**
 * Disable input.
 *
 * @private
 */
TerminalInput.prototype._disable = function () {

    this.TERMINAL.elements.input.setAttribute("disabled", "");
    this.ENABLED = false;
    this.caret.hide();

};

/**
 * Returns caret position from beginning of input.
 */
TerminalInput.prototype.getCaretPosition = function () {
    if (typeof this.TERMINAL.elements.input.selectionStart !== "undefined") {
        return this.TERMINAL.elements.input.selectionStart;
    } else return this.TERMINAL.elements.input.value.length;
};

/**
 * @returns {string}
 */
TerminalInput.prototype.get = function () {
    return this.TERMINAL.elements.input.value;
};

/**
 * @param {number} position
 */
TerminalInput.prototype.setCaretPosition = function (position) {
    this.TERMINAL.elements.input.selectionStart =
        this.TERMINAL.elements.input.selectionEnd = position;
};

/**
 * Complete the input with autocomplete variant if available.
 */
TerminalInput.prototype.complete = function () {

    var variant = this.getCurrentAutocompleteVariant(),
        caretPosition = this.getCaretPosition();

    if (!variant) return;

    this.set(this.get().splice(caretPosition, 0, variant));
    this.setCaretPosition(caretPosition + variant.length);
    this._onInput();

};

/**
 * @returns {string}
 */
TerminalInput.prototype.getCurrentAutocompleteVariant = function () {

    return this._autocompleteVariants[this._currentAutocompleteVariant] || "";

};

/**
 * @param {number} delta
 * @private
 */
TerminalInput.prototype._changeAutocompleteVariant = function (delta) {

    this._currentAutocompleteVariant = (this._currentAutocompleteVariant + delta)
        % this._autocompleteVariants.length || 0;
    if (this._currentAutocompleteVariant < 0) this._currentAutocompleteVariant
        += this._autocompleteVariants.length || 0;
    this._updateAutocompleteView();

};

/**
 * Prints the current autocomplete variant if available and returns caret to position of print
 * start.
 *
 * @private
 */
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

};

/**
 * Terminal input handler. Fires when hidden input changes.
 *
 * The algorithm:
 *  ? Output can be print at any part of terminal because it is not restricted by size. So this
 *  function use capable options setup to allow printing out-of-terminal window.
 *  1. Print actual input at line where it was prompted and leave caret unrestricted;
 *  2. Print spaces on erased symbols place and then restore unrestricted caret position;
 *  3. Decrease top line if caret.x < 1 to make caret visible on screen;
 *  4. Restrict the caret position.
 *
 *  @private
 */
TerminalInput.prototype._onInput = function () {

    var i, cx, cy,
        string = "",
        value = this.TERMINAL.elements.input.value,
        length = value.length;

    if (this.TERMINAL.settings.AUTOCOMPLETE) {
        this._autocompleteVariants =
            this.TERMINAL.autocomplete.getEndings(
                value.substring(0, this.getCaretPosition())
            );
        this._changeAutocompleteVariant(0);
    }

    this.TERMINAL.output.printAtLine(
        this.TERMINAL.settings.HIGHLIGHT_INPUT
            ? this.TERMINAL.parser.highlightSyntax(value, this.TERMINAL.theme.getCurrentTheme())
            : value,
        this.INITIAL_POSITION.line,
        this.INITIAL_POSITION.position,
        false
    );

    for (i = 0; i < this.__inputLastLength - length; i++) {
        string += " ";
    }

    cx = this.TERMINAL.output.getCaretX();
    cy = this.TERMINAL.output.getCaretY();

    this.TERMINAL.output.$CARET_RESTRICTION_ON = false;
    this.TERMINAL.output.printSync(string);
    this.TERMINAL.output.$CARET_RESTRICTION_ON = true;
    if (this.TERMINAL.output.getCaretY() < 1) {
        this.TERMINAL.output.increaseTopLine(this.TERMINAL.output.getCaretY() - 1);
    }

    this.TERMINAL.output.setCaretX(cx);
    this.TERMINAL.output.setCaretY(cy);

    this.__inputLastLength = length + this.getCurrentAutocompleteVariant().length;
    if (length === this.TERMINAL.elements.input.maxLength) {
        this.submit();
    }

    this.TERMINAL.output.scrollToActualLine();
    this._updateAutocompleteView();
    this.caret.update();

};

/**
 * Key press handler. Handles non-printable characters and keyboard combinations.
 *
 * @param {KeyboardEvent} event
 */
TerminalInput.prototype.keyDown = function (event) {

    var key = event.charCode || event.keyCode,
        _this = this;

    switch (key) {
        case 9: {
            this.complete();
            event.preventDefault();
        } break; // tab
        case 13: {
            this.set(this.TERMINAL.definitions.replace(this.TERMINAL.elements.input.value));
            this.submit();
        } break; // enter
        case 16: {

        } break; // shift
        case 17: {
            if (event["location"] !== 1) {
                this._changeAutocompleteVariant(-1);
            } else {
                this._changeAutocompleteVariant(1);
            }
        } break; // ctrl
        case 35: setTimeout(function () { _this._onInput(); }, 1); break; // end
        case 36: setTimeout(function () { _this._onInput(); }, 1); break; // home
        case 37: setTimeout(function () { _this._onInput(); }, 1); break; // left arrow
        case 39: setTimeout(function () { _this._onInput(); }, 1); break; // right arrow
    }

};

/**
 * Submit the input. Also is the handler.
 */
TerminalInput.prototype.submit = function () {

    var value = this.TERMINAL.elements.input.value,
        handler = this._handler;

    if (this.TERMINAL.settings.SHOW_PROGRESS_INDICATOR) {
        this.TERMINAL.progressIndicator.show();
    }
    this._disable();
    this.history.save(value);
    this.TERMINAL.elements.input.value = "";
    this.__inputLastLength = 0;
    this._autocompleteVariants = [];
    if (typeof handler === "function") {
        this._handler = null;
        handler.call(this, value);
    } else {
        this.TERMINAL.autocomplete.parseForCacheTokens(value);
        this.TERMINAL.controller.terminalQuery(value);
    }
    this._updateAutocompleteView();

};

/**
 * Limit input length.
 *
 * @param {number} symbols
 */
TerminalInput.prototype.limitLength = function (symbols) {
    this.TERMINAL.elements.input.maxLength = symbols;
};

/**
 * @param {string} [invitationMessage]
 * @param {number=32656} [length]
 * @param {function} [handler] - Handle prompted string.
 */
TerminalInput.prototype.prompt = function (invitationMessage, length, handler) {

    if (handler) {
        if (this._handler) console.warn("Possible wrong handler usage.");
        this._handler = handler;
    }

    this.TERMINAL.progressIndicator.hide();

    this.limitLength(length || 32656);
    this.TERMINAL.output.printSync(invitationMessage || "");

    this.INITIAL_POSITION.line = this.TERMINAL.output.getLineNumber();
    this.INITIAL_POSITION.position = this.TERMINAL.output.getCaretX() - 1;

    this._enable();

};

/**
 * Get character from keyboard. This works for all keys.
 *
 * @param {function} callback
 */
TerminalInput.prototype.getChar = function (callback) {

    var _this = this,
        shift = false;

    if (this.__readingChar) return false;

    this.__readingChar = true;

    this.TERMINAL.progressIndicator.hide();

    var listener = function (e) {

        var code = e.keyCode,
            char = String.fromCharCode(code);

        if (code === 16) shift = true;
        if (code === 16 || code === 17 || code === 18) return;

        if (shift) {
            char = char.toUpperCase();
        } else {
            char = char.toLowerCase();
        }

        _this.TERMINAL.output.print(char);

        window.removeEventListener("keydown", listener, true);
        window.removeEventListener("keyup", upListener, true);
        e.preventDefault();
        e.cancelBubble = true;

        _this.__readingChar = false;
        callback.call(_this, char.charCodeAt(0).toString());

    };

    var upListener = function (e) {

        if (e.keyCode === 16) shift = false;

    };

    window.addEventListener("keydown", listener, true);
    window.addEventListener("keyup", upListener, true);

};