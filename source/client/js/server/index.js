import { printLine } from "../output";
import { get as localize } from "../localization";
import * as handlers from "./handlers";

/*
 * WebSocket message body (parsed):
 * {
 *  h: "HandlerName",
 *  d: "data"
 * }
 * OR
 * "o" _ "<rest plain data>" => is transformed to => { h: "o", d: "<rest plain data>" }
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
        if (m.data[0] === "o") { // Enables 2013.2 support (no JSON)
            onMessage({ h: "o", d: m.data.slice(1) });
            return;
        }
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

// todo: remove after test
window.send = send;