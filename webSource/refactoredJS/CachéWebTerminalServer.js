/**
 * Connection between server and client is handled with instance of this function.
 *
 * @param {TerminalController} CONTROLLER
 * @param {string} IP
 * @param {string} PORT - Port number, may be empty.
 * @constructor
 */
var CachéWebTerminalServer = function (CONTROLLER, IP, PORT) {

    /**
     * @type {string}
     */
    this.CACHÉ_CLASS_NAME = "%WebTerminal.Engine.cls";

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

CachéWebTerminalServer.prototype.RECONNECTION_TIMEOUT = 10000;

CachéWebTerminalServer.prototype.initialize = function () {

    var _this = this;

    try {
        this.socket = new WebSocket(
                "ws://" + this.IP + (this.PORT ? ":" + this.PORT : "") + "/"
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
        _this.CONTROLLER.serverData(event.data);
    };

};

/**
 * Send string to server.
 *
 * @param {string|ArrayBuffer} string
 */
CachéWebTerminalServer.prototype.send = function (string) {

    try {
        this.socket.send(string);
    } catch (e) {
        this.CONTROLLER.TERMINAL.output.print("Unable to send data to server.\r\n");
        console.error(e);
    }

};

/**
 * @param {event} event
 */
CachéWebTerminalServer.prototype.onConnect = function (event) {

    this.CONTROLLER.TERMINAL.output.print("Connection to Caché Server established.\r\n");

};

/**
 * @param {event} event
 */
CachéWebTerminalServer.prototype.onClose = function (event) {

    this.CONTROLLER.TERMINAL.output.print("WebSocket connection closed. Code " + event["code"]
        + (event["reason"] ? ", reason: " + event["reason"] : "") + ".\r\n");

};

/**
 * Error trigger.
 */
CachéWebTerminalServer.prototype.onError = function () {

    var _this = this;

    this.CONTROLLER.TERMINAL.output.print("WebSocket (" + this.socket.url +
        ") connection error! Trying to connect again in " + this.RECONNECTION_TIMEOUT/1000
        + " seconds...\r\n");

    setTimeout(function () {
        _this.initialize();
    }, this.RECONNECTION_TIMEOUT);

};
