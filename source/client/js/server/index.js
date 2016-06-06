import { get } from "../lib";
import { printLine } from "../output";
import { get as localize } from "../localization";
import * as handlers from "./handlers";

/*
 * WebSocket message body (parsed):
 * {
 *  h: "handlerName",
 *  d: "data"
 * }
 */

const CACHE_CLASS_NAME = `WebTerminal.Engine.cls`;
const RECONNECT_IN = 10000; // ms

let CONNECTED = false;

let ws,
    stack = [],
    reconnectTimeout = 0,
    firstMessage;

try {
    connect();
} catch (e) {
    printLine(localize(`wsErr`, e.toString()));
}

function connect () {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = 0;
    ws = getNewWs();
    ws.addEventListener(`open`, onOpen);
    ws.addEventListener(`close`, onClose);
    ws.addEventListener(`error`, onError);
    ws.addEventListener(`message`, (m) => {
        let d;
        try {
            d = JSON.parse(m.data);
        } catch (e) {
            printLine(localize(`serParseErr`, m.data));
            return;
        }
        onMessage(d);
    });
}

/**
 * Connect to the server or return alive connection.
 */
function getNewWs () {
    return new WebSocket(`${ (location.protocol === "https:" ? "wss:" : "ws:")
        }//${ location.hostname }:${ location.port ||
        (location.protocol === "https:" ? "443" : "80")
        }/terminalsocket/${ encodeURIComponent(CACHE_CLASS_NAME) }`);
}

function onOpen () {
    CONNECTED = true;
    freeStack();
}

function onError (e) {
    printLine(localize(`wsErr`, e.toString()));
}

function onClose (e) {
    CONNECTED = false;
    if (e.code !== 1000) {
        printLine(`\r\n${ localize(`wsConnLost`, e.code) }`);
        printLine(localize(`reConn`, RECONNECT_IN / 1000));
        reconnectTimeout = setTimeout(() => {
            printLine(localize(`plRefPageSes`)); // todo: restore session [https://community.intersystems.com/post/it-possible-not-terminate-jobbed-process-when-parent-process-terminates]
            // stack.unshift(firstMessage);
            // connect();
        }, RECONNECT_IN);
    } else {
        printLine(localize(`seeYou`));
    }
}

function onMessage (data = {}) {
    if (data.h) {
        if (typeof handlers[data.h] === "function") {
            handlers[data.h](data.d);
        } else {
            printLine(`\r\n` + localize(`eInt`, `E.server.index.1 (${ data.h })`));
        }
    } else {
        printLine(`\r\n` + localize(`eInt`, `E.server.index.2 (${ data })`));
    }
}

function freeStack () {
    if (!CONNECTED)
        return;
    stack = stack.filter((m) => {
        try {
            ws.send(JSON.stringify(m));
        } catch (e) {
            if (!reconnectTimeout)
                reconnectTimeout = setTimeout(connect, RECONNECT_IN);
            return true;
        }
        return false;
    });
}

/**
 * Send message to a server.
 * @param {string} handler - Handler name.
 * @param {*} data
 */
export function send (handler, data) {
    let message = {
        h: handler,
        d: data
    };
    if (!firstMessage)
        firstMessage = message;
    stack.push(message);
    freeStack();
}

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

    this.initialize();

};

CacheWebTerminalServer.prototype.RECONNECTION_TIMEOUT = 10000;

CacheWebTerminalServer.prototype.initialize = function () {

    var _this = this;

    try {
        this.socket = new WebSocket(this.CONNECTION_URL);
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

    get("autocomplete?NS=" + encodeURIComponent(namespace), (data) => {

        try {
            data = JSON.parse(data);
        } catch (e) {
            data = null;
            console.warn("Unable to parse autocomplete data for " + namespace);
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
        //console.log("server << ", string);
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

    var key, ns;

    this.CONTROLLER.TERMINAL.output.print(this._lc.get(2) + "\r\n");
    if (key = this.CONTROLLER.TERMINAL.SETUP["authKey"]) {
        this.send(key + ((ns = this.CONTROLLER.TERMINAL.SETUP.defaultNamespace) ? "#" + ns : ""));
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
        this._lc.get(6, this.socket.url, this.RECONNECTION_TIMEOUT/1000) + "\r\n"
    );

    setTimeout(function () {
        _this.initialize();
    }, this.RECONNECTION_TIMEOUT);

};
