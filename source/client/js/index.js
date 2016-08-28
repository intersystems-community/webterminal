import "babel-polyfill";
import "./network";
import * as output from "./output";
import * as input from "./input";
import * as locale from "./localization";
import * as server from "./server";
import { initDone } from "./init";
import { get } from "./lib";

let onAuthHandlers = [],
    userInputHandlers = [],
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

export function onUserInput (text, mode) {
    userInputHandlers.forEach((h) => h(text, mode));
}

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
Terminal.prototype.MODE_SPECIAL = 1;

/**
 * Function accepts the callback, which is fired when user enter a command, character or a string.
 * @param {terminalUserEntryCallback} callback
 */
Terminal.prototype.onUserInput = function (callback) {
    userInputHandlers.push(callback);
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
    terminal = new Terminal();
    let text = locale.get(`beforeInit`);
    output.printLine(text);
    get("auth", (obj) => {
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
            output.printLine(locale.get(`wsErr`, e.toString()));
        }
    });
}

window[addEventListener ? `addEventListener` : `attachEvent`](
    addEventListener ? `load` : `onload`,
    initialize
);
