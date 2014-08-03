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
     * @type {string}
     */
    this.CACHÉ_CLASS_NAME = "%WebTerminal.Engine.cls";

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
                + this.CACHÉ_CLASS_NAME.replace(/%/g,"%25")
        );
    } catch (e) {
        this.onError();
        console.error(e);
    }

    this.socket.onopen = function (event) {
        _this.onConnect(event);
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
 * Send string to server.
 *
 * @param {string|ArrayBuffer} string
 */
CacheWebTerminalServer.prototype.send = function (string) {

    try {
        console.log("server << ", string);
        this.socket.send(string);
    } catch (e) {
        this.CONTROLLER.TERMINAL.output.print("Unable to send data to server.\r\n");
        console.error(e);
    }

};

/**
 * Connection handler.
 */
CacheWebTerminalServer.prototype.onConnect = function () {

    this.CONTROLLER.TERMINAL.output.print("Connection to Caché Server established.\r\n");

};

/**
 * @param {event} event
 */
CacheWebTerminalServer.prototype.onClose = function (event) {

    this.CONTROLLER.TERMINAL.output.print("WebSocket connection closed. Code " + event["code"]
        + (event["reason"] ? ", reason: " + event["reason"] : "") + ".\r\n");

};

/**
 * Error trigger.
 */
CacheWebTerminalServer.prototype.onError = function () {

    var _this = this;

    this.CONTROLLER.TERMINAL.output.print("WebSocket (" + this.socket.url +
        ") connection error! Trying to connect again in " + this.RECONNECTION_TIMEOUT/1000
        + " seconds...\r\n");

    setTimeout(function () {
        _this.initialize();
    }, this.RECONNECTION_TIMEOUT);

};
