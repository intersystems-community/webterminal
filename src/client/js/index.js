import "babel-polyfill";
import "./network";
import * as output from "./output";
import * as input from "./input";
import * as locale from "./localization";
import * as server from "./server";
import * as config from "./config";
import { initDone } from "./init";
import { get, getURLParams } from "./lib";

let onAuthHandlers = [],
    userInputHandlers = [],
    outputHandlers = [],
    bufferedOutput = [],
    AUTHORIZED = false,
    terminal = null;

export const VERSION = "/* @echo package.version */";

export let NAMESPACE = "USER",
           MODE = Terminal.prototype.MODE_PROMPT; // PROMPT || SQL, other modes are emulated

export function onAuth (callback) {
    if (AUTHORIZED) {
        callback(terminal);
        return;
    }
    onAuthHandlers.push(callback);
}

export function authDone () {
    if (AUTHORIZED)
        return;
    AUTHORIZED = true;
    onAuthHandlers.forEach(h => h(terminal));
}

export const inputActivated = () => {
    if (bufferedOutput.length) {
        for (const handler of outputHandlers) {
            if (handler.stream)
                continue;
            handler.callback(bufferedOutput);
        }
        bufferedOutput = [];
    }
};

export const onUserInput = (text, mode) => {
    userInputHandlers.forEach((h) => h(text, mode));
    bufferedOutput = [];
};

export const onOutput = (string) => {
    bufferedOutput.push(string);
    for (const handler of outputHandlers) {
        if (!handler.stream)
            continue;
        handler.callback([ string ]);
    }
};

/**
 * Register the callback which will be executed right after terminal is initialized. This callback
 * is simultaneously triggered if WebTerminal initialization is already done.
 * @param {terminalInitCallback} callback
 */
window.onTerminalInit = onAuth;

/**
 * WebTerminal's API object.
 * @author ZitRo
 */
export function Terminal () {

    initDone(this);

}

Terminal.prototype.MODE_PROMPT = 1;
Terminal.prototype.MODE_SQL = 2;
Terminal.prototype.MODE_READ = 3;
Terminal.prototype.MODE_READ_CHAR = 4;
Terminal.prototype.MODE_SPECIAL = 5;

/**
 * Function accepts the callback, which is fired when user enter a command, character or a string.
 * @param {{ [stream]: boolean=false, [callback]: function }} [options]
 * @param {terminalOutputCallback} callback
 * @returns {function} - Your callback.
 */
Terminal.prototype.onOutput = function (options, callback) {
    if (!options || typeof options === "function") {
        callback = options || (() => { throw new Error("onOutput: no callback provided!"); });
        options = {};
    }
    if (typeof options.stream === "undefined")
        options.stream = false;
    options.callback = callback;
    outputHandlers.push(options);
    return callback;
};

/**
 * Handles output both in stream or prompt mode.
 * @callback terminalOutputCallback
 * @param {string[]} - Output data presented as an array of string chunks. You can get the full
 *                     output as a single string by doing chunks.join("").
 */

/**
 * Function accepts the callback, which is fired when user enter a command, character or a string.
 * @param {terminalUserEntryCallback} callback
 * @returns {function} - Your callback.
 */
Terminal.prototype.onUserInput = function (callback) {
    if (typeof callback !== "function")
        throw new Error("onUserInput: no callback provided!");
    userInputHandlers.push(callback);
    return callback;
};

/**
 * Handles user input.
 * @callback terminalUserEntryCallback
 * @param {String} text
 * @param {Number} mode
 */

/**
 * Print the text on terminal.
 * @param {string} text
 */
Terminal.prototype.print = function (text) {
    input.clearPrompt();
    output.print(text);
    input.reprompt();
};

/**
 * Print the text on terminal.
 * @param {string} command
 * @param {boolean=false} echo
 * @param {boolean=false} prompt
 */
Terminal.prototype.execute = function (command, { echo = false, prompt = false } = {}) {
    server.send("Execute", { command, echo: +echo, prompt: +prompt });
};

function initialize () {
    let text = locale.get(`beforeInit`),
        urlParams = getURLParams();
    terminal = new Terminal();

    output.printLine(text);
    let ns = urlParams["NS"] || urlParams["ns"] || config.get("defaultNamespace"),
        urlPs = location.search.match(/ns=[^&]*/i) === null
            ? location.search === ""
                ? ns
                    ? `?ns=${ encodeURIComponent(ns) }`
                    : ""
                : location.search + (ns ? `&ns=${ encodeURIComponent(ns) }` : "")
            : ns
                ? location.search.replace(/ns=[^&]*/i, `ns=${ encodeURIComponent(ns) }`)
                : location.search;
    get("auth" + urlPs, (obj) => {
        if (!obj.key) {
            output.printLine(locale.get(`unSerRes`), JSON.stringify(obj));
            return;
        }
        try {
            output.print(`\x1b[1;1H` + (new Array(text.length + 1)).join(` `) + `\x1b[1;1H`);
            server.connect({
                key: obj.key
            });
        } catch (e) {
            output.printLine(locale.get(`jsErr`, e.message));
        }
    });
}

window[addEventListener ? `addEventListener` : `attachEvent`](
    addEventListener ? `load` : `onload`,
    initialize
);
