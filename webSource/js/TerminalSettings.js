/**
 * Object that controls additional settings.
 *
 * @param {Terminal} TERMINAL
 * @constructor
 */
var TerminalSettings = function (TERMINAL) {

    /**
     * @type {Terminal}
     */
    this.TERMINAL = TERMINAL;

    /**
     * @type {boolean}
     */
    this.SHOW_PROGRESS_INDICATOR = true;

    /**
     * @type {boolean}
     */
    this.HIGHLIGHT_INPUT = true;

    /**
     * @type {boolean}
     */
    this.AUTOCOMPLETE = true;

    this.initialize();

};

TerminalSettings.prototype.STORAGE_NAME_SHOW_PROGRESS_INDICATOR = "terminal-showProgressIndicator";

TerminalSettings.prototype.STORAGE_NAME_HIGHLIGHT_INPUT = "terminal-highlightInput";

TerminalSettings.prototype.STORAGE_NAME_AUTOCOMPLETE = "terminal-autocomplete";

TerminalSettings.prototype.initialize = function () {

    var _this = this,
        stringTrue = function (a) { return a === "true" ? true : a === "false" ? false : false },
        makeDefault = function (p, d) {
            if (_this[p] === null) _this[p] = d; else _this[p] = stringTrue(_this[p]);
        };

    this.SHOW_PROGRESS_INDICATOR =
        this.TERMINAL.storage.get(this.STORAGE_NAME_SHOW_PROGRESS_INDICATOR);
    makeDefault("SHOW_PROGRESS_INDICATOR", true);

    this.HIGHLIGHT_INPUT = this.TERMINAL.storage.get(this.STORAGE_NAME_HIGHLIGHT_INPUT);
    makeDefault("HIGHLIGHT_INPUT", true);

    this.AUTOCOMPLETE = this.TERMINAL.storage.get(this.STORAGE_NAME_AUTOCOMPLETE);
    makeDefault("AUTOCOMPLETE", true);

};

/**
 * @param {boolean} boolean
 */
TerminalSettings.prototype.setShowProgressIndicator = function (boolean) {

    this.SHOW_PROGRESS_INDICATOR = boolean;
    this.TERMINAL.storage.set(this.STORAGE_NAME_SHOW_PROGRESS_INDICATOR, boolean.toString());
    return boolean;

};

/**
 * @param {boolean} boolean
 */
TerminalSettings.prototype.setHighlightInput = function (boolean) {

    this.HIGHLIGHT_INPUT = boolean;
    this.TERMINAL.storage.set(this.STORAGE_NAME_HIGHLIGHT_INPUT, boolean.toString());
    return boolean;

};

/**
 * @param {boolean} boolean
 */
TerminalSettings.prototype.setAutocomplete = function (boolean) {

    this.AUTOCOMPLETE = boolean;
    this.TERMINAL.storage.set(this.STORAGE_NAME_AUTOCOMPLETE, boolean.toString());
    return boolean;

};