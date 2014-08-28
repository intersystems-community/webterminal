/**
 * Connection between server and client is handled with instance of this function.
 *
 * @param {TerminalController} CONTROLLER
 * @param {string} WS_PROTOCOL - String of type "ws:" or "wss:"
 * @param {string} IP
 * @param {string} PORT - Port number, may be empty.
 * @constructor
 */
var CacheWebTerminalServer = function (CONTROLLER, WS_PROTOCOL, IP, PORT) {

    /**
     * @type {TerminalLocalization}
     * @private
     */
    this._lc = CONTROLLER.TERMINAL.localization;

    /**
     * @type {string}
     */
    this.CACHE_CLASS_NAME = "%WebTerminal.Engine.cls";

    /**
     * @type {string}
     */
    this.PROTOCOL = WS_PROTOCOL;

    /**
     * @type {string}
     */
    this.IP = IP;

    /**
     * @type {number}
     */
    this.PORT = PORT;

    /**
     * @type {TerminalController}
     */
    this.CONTROLLER = CONTROLLER;

    /**
     * @type {WebSocket}
     */
    this.socket = null;

    this.initialize();

};

CacheWebTerminalServer.prototype.RECONNECTION_TIMEOUT = 10000;

CacheWebTerminalServer.prototype.initialize = function () {

    var _this = this;

    try {
        this.socket = new WebSocket(
                this.PROTOCOL + "//" + this.IP + (this.PORT ? ":" + this.PORT : "") + "/"
                + encodeURIComponent(this.CACHE_CLASS_NAME)
        );
    } catch (e) {
        this.onError();
        console.error(e);
    }

    this.socket.onopen = function (event) {
        _this.onConnect.call(_this, event);
    };

    this.socket.onclose = function (event) {
        _this.onClose(event);
    };

    this.socket.onerror = function () {
        _this.onError();
    };

    this.socket.onmessage = function (event) {
        console.log("server >> ", event.data);
        _this.CONTROLLER.serverData(event.data);
    };

};

/**
 * Handler for autocomplete request.
 *
 * @callback autocompleteCallback
 * @param {object} data
 * @param {string} namespace
 */

/**
 * @param {string} namespace
 * @param {autocompleteCallback} callback
 */
CacheWebTerminalServer.prototype.getAutocompleteFile = function (namespace, callback) {

    AJAX.get("js/autocomplete/" + encodeURIComponent(namespace) + ".js", function (data) {

        try {
            data = JSON.parse(data);
        } catch (e) {
            data = null;
            console.warn("No autocomplete data for " + namespace);
        }

        callback(data, namespace);

    });

};

/**
 * Send string to server.
 *
 * @param {string|ArrayBuffer} string
 */
CacheWebTerminalServer.prototype.send = function (string) {

    try {
        console.log("server << ", string);
        this.socket.send(string);
    } catch (e) {
        this.CONTROLLER.TERMINAL.output.print(this._lc.get(3) + "\r\n");
        console.error(e);
    }

};

/**
 * Connection handler.
 */
CacheWebTerminalServer.prototype.onConnect = function () {

    var key;

    this.CONTROLLER.TERMINAL.output.print(this._lc.get(2) + "\r\n");
    if (key = this.CONTROLLER.TERMINAL.SETUP["authKey"]) {
        this.send(key);
    }

};

/**
 * @param {event} event
 */
CacheWebTerminalServer.prototype.onClose = function (event) {

    this.CONTROLLER.TERMINAL.output.print(this._lc.get(4, event["code"], event["reason"])
        + "\r\n");

};

/**
 * Error trigger.
 */
CacheWebTerminalServer.prototype.onError = function () {

    var _this = this;

    this.CONTROLLER.TERMINAL.output.print(
        this._lc.get(6, this.socket.url, this.RECONNECTION_TIMEOUT/1000)
    );

    setTimeout(function () {
        _this.initialize();
    }, this.RECONNECTION_TIMEOUT);

};
