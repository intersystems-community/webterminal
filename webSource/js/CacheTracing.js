/**
 * Set of trace capabilities for Caché WEB Terminal.
 * @param {TerminalController} CONTROLLER
 * @constructor
 */
var CacheTracing = function (CONTROLLER) {

    /**
     * @type {TerminalLocalization}
     * @private
     */
    this._lc = CONTROLLER.TERMINAL.localization;

    /**
     * @type {TerminalController}
     */
    this.CONTROLLER = CONTROLLER;

    /**
     * Globals and file names to trace
     *
     * @type {{string}}
     * @private
     */
    this._trace = {};

    /**
     * @type {number}
     * @private
     */
    this._interval = 0;

    /**
     * @type {number}
     */
    this.TRACING_INTERVAL = 1000;

};

CacheTracing.prototype._timeout = function () {

    if (!this.CONTROLLER.EXECUTION_IN_PROGRESS) {
        this.CONTROLLER.server.send(this.CONTROLLER.SERVER_ACTION.CHECK_TRACE);
    }

};

/**
 * Trusted trace instance from server.
 *
 * @param {string} name
 */
CacheTracing.prototype.start = function (name) {

    var _this = this;

    if (name.charAt(0) === "!") {
        this.CONTROLLER.TERMINAL.output.print(this._lc.get(5, name.substr(1)));
        return;
    }

    if (!this._interval) {
        this._interval = setInterval(function () {
            _this._timeout.call(_this);
        }, _this.TRACING_INTERVAL);
    }

    this._trace[name] = true;
    this.CONTROLLER.TERMINAL.output.print(this._lc.get(7, name));

};

/**
 * Stop tracing.
 *
 * @param {string} [name] - If not set, stops all tracing variables and files.
 */
CacheTracing.prototype.stop = function (name) {

    var empty = true;

    if (name) {
        delete this._trace[name];
        this.CONTROLLER.TERMINAL.output.print(this._lc.get(8, name));
    } else {
        for (empty in this._trace) {
            this.CONTROLLER.server.send(this.CONTROLLER.SERVER_ACTION.TRACE + empty);
        }
    }

    for (empty in this._trace) {
        empty = false;
        break;
    }

    if (empty) {
        clearInterval(this._interval);
        this._interval = 0;
    }

};