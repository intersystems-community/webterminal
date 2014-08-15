/**
 * Terminal input controller.
 *
 * @see TerminalElements.input
 * @param {Terminal} TERMINAL
 * @constructor
 */
var TerminalInput = function (TERMINAL) {

    /**
     * @type {Terminal}
     */
    this.TERMINAL = TERMINAL;

    /**
     * @type {boolean}
     * @debug
     */
    this.ENABLED = false;

    /**
     * @type {TerminalInputHistory}
     */
    this.history = new TerminalInputHistory(this);

    /**
     * @type {TerminalInputCaret}
     */
    this.caret = new TerminalInputCaret(this);

    /**
     * Variants of autocompletion.
     *
     * @see TerminalInput._onInput - Updating.
     * @type {string[]}
     */
    this._autocompleteVariants = [];

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
     * Shows the input beginning position.
     *
     * @type {{line: number, position: number}}
     * @private
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

    var element = this.TERMINAL.elements.input,
        length;

    element.value = text;
    length = element.value.length;
    this._onInput();
    setTimeout(function() { element.setSelectionRange(length, length); }, 1);

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
    return this.TERMINAL.elements.input.selectionStart || this.TERMINAL.elements.input.value.length;
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

    return this._autocompleteVariants[0] || "";

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
        length = this.TERMINAL.elements.input.value.length;

    this._autocompleteVariants =
        this.TERMINAL.autocomplete.getEndings(
            this.TERMINAL.elements.input.value.substring(0, this.getCaretPosition())
        );

    this.TERMINAL.output.printAtLine(
        this.TERMINAL.elements.input.value,
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
        case 13: this.submit(); break; // enter
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

    var value = this.TERMINAL.elements.input.value;

    this._disable();
    this.history.save(value);
    this.TERMINAL.elements.input.value = "";
    this.__inputLastLength = 0;
    this._autocompleteVariants = [];
    this.TERMINAL.controller.terminalQuery(value);
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
 */
TerminalInput.prototype.prompt = function (invitationMessage, length) {

    this.limitLength(length || 32656);
    this.TERMINAL.output.printSync(invitationMessage || "");

    this.INITIAL_POSITION.line = this.TERMINAL.output.getLineNumber();
    this.INITIAL_POSITION.position = this.TERMINAL.output.getCaretX() - 1;

    this._enable();

};