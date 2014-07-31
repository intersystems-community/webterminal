/**
 * Terminal input controller.
 * todo.
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
    this.ENABLED = true;

    /**
     * @type {TerminalInputHistory}
     */
    this.history = new TerminalInputHistory();

    /**
     * @type {TerminalInputCaret}
     */
    this.caretView = new TerminalInputCaret(this);

    /**
     * Variable that indicates last length of input to determine if text was erazed.
     *
     * @see this.prototype.onInput
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
    this._initialPosition = {
        line: 0,
        position: 0
    };

    this.initialize();

};

TerminalInput.prototype.initialize = function () {

    var _this = this;

    window.addEventListener("keydown", function () { // PC devices
        // activeElement is an HTMLElement
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
    }, false);

    this.TERMINAL.elements.input.addEventListener("input", function () {
        if (_this.ENABLED) {
            _this.onInput(event);
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
 * Enable input.
 *
 * @private
 */
TerminalInput.prototype._enable = function () {

    this.ENABLED = true;
    this.TERMINAL.elements.input.removeAttribute("disabled");
    this.focus();

};

/**
 * Disable input.
 *
 * @private
 */
TerminalInput.prototype._disable = function () {

    this.TERMINAL.elements.input.setAttribute("disabled", "");
    this.ENABLED = false;

};

/**
 * Terminal input handler. Fires when hidden input changes.
 */
TerminalInput.prototype.onInput = function () {

    var i, cx, cy,
        string = "",
        length = this.TERMINAL.elements.input.value.length;

    this.TERMINAL.output.printFromLineActualPosition(
        this.TERMINAL.elements.input.value,
        this._initialPosition.line,
        this._initialPosition.position
    );

    for (i = 0; i < this.__inputLastLength - length; i++) {
        string += " ";
    }

    cx = this.TERMINAL.output.getCaretX();
    cy = this.TERMINAL.output.getCaretY();

    this.TERMINAL.output.printSync(string);

    this.TERMINAL.output.setCaretX(cx);
    this.TERMINAL.output.setCaretY(cy);

    this.__inputLastLength = length;

};

/**
 * Key press handler. Handles non-printable characters and keyboard combinations.
 *
 * @param {KeyboardEvent} event
 */
TerminalInput.prototype.keyDown = function (event) {

    var key = event.charCode || event.keyCode;

    switch (key) {
        case 13: this.submit(); break; // enter
    }

};

/**
 * Submit the input. Also is the handler.
 */
TerminalInput.prototype.submit = function () {

    this.TERMINAL.elements.input.value = "";
    this.prompt("TEST > ");

};

/**
 * @param {string} [invitationMessage]
 * @param {function} [handler]
 */
TerminalInput.prototype.prompt = function (invitationMessage, handler) {

    if (invitationMessage) {
        this.TERMINAL.output.printNewLine();
        this.TERMINAL.output.printSync(invitationMessage);
    }

    this._initialPosition.line = this.TERMINAL.output.getLineNumber();
    this._initialPosition.position = this.TERMINAL.output.getCaretX() - 1;

    this._enable();

};