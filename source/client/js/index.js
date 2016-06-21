import "babel-polyfill";
import * as output from "./output";
import * as input from "./input";
import * as server from "./server";
import { initDone } from "./init";

let terminal = null;

export const VERSION = "/* @echo package.VERSION */";
export const RELEASE_NUMBER = "/* @echo package.releaseNumber */";

/**
 * Returns terminal instance.
 * @param options
 * @avoidUsing - use direct methods instead.
 * @returns {*}
 */
export function initTerminal (options) {
    if (terminal)
        return terminal;
    return terminal = new Terminal(options);
}

window.initTerminal = initTerminal;

/**
 * Registers the callback which will be executed after terminal initialization.
 * @param {function} callback ()
 */
/*
export function onInit (callback) {
    if (INITIALIZED)
        callback();
    console.log(">>", initHandlers);
    initHandlers.push(callback);
}

function initDone () {
    INITIALIZED = true;
    initHandlers.forEach(h => h());
}*/

/**
 * Main controller object for terminal application.
 *
 * @author ZitRo
 *
 * Architecture:
 *
 *    Globals - Some global definitions.
 *       ║
 *       ║           {CacheWebTerminalServer} - Default server adapter for InterSystems Caché.
 *       ║                      ║
 *       ╔ {TerminalController} ╣ - Controller, object that implements terminalQuery function and
 *       ║                      ║   uses terminal API for interaction with terminal application.
 *       ║                      ║
 *       ║                      ╠ {CacheAutocompleteController} - Stores and controls autocomplete.
 *       ║                      ╚ {CacheTracing} - Mechanism that controls tracing.
 *       ║
 *   {Terminal}
 *       ║
 *       ╠ {TerminalInitialDictionary} - Initial keywords of terminal.
 *       ╠ {TerminalElements} - Handles terminal DOM elements and elements structure. Modules can
 *       ║                      access this elements.
 *       ╠ {TerminalLocalization} - Object-database that obtain localizations.
 *       ╠ {TerminalStorage} - Persistent storage adapter for saving data.
 *       ╠ {TerminalFavorites} - Handles favored commands.
 *       ╠ {TerminalAutocomplete} - Holds autocomplete mechanism for terminal.
 *       ╠ {TerminalOutput} - Output mechanism of terminal.
 *       ║       ╚ {TerminalOutputLine} - Representation of one terminal line of text.
 *       ╠ {TerminalInput}
 *       ║       ╚ {TerminalInputCaret} - Visible caret.
 *       ║       ╚ {TerminalInputHistory} - Terminal command history.
 *       ╠ {TerminalHint} - Represents a floating string of text inside terminal.
 *       ╠ {TerminalDictionary} - All lexemes that form autocomplete database.
 *       ╠ {TerminalTheme} - Appearance controller for terminal.
 *       ╠ {TerminalParser} - Additional module highlighting the syntax.
 *       ╠ {TerminalIndicator} - Indicates command execution progress.
 *       ╚ {TerminalFavorites} - Favorites storage.
 *
 *
 * @param setup {{
 *     controller: TerminalController,
 *     [container]: HTMLElement,
 *     defaultNamespace: string,
 *     authKey: String
 * }}
 */
function Terminal (setup = {}) {

    server.send("auth", setup.authKey);
    initDone();

}

/*
Terminal.prototype.initialize = function () {

    var i,
        favicon = document.getElementById("favicon");

    if (favicon)
        favicon.href = lib.images.favicon;

    for (i in this.controller.internalCommands) {
        this.autocomplete.register(this.autocomplete.TYPES.keyword, "/" + i);
    }

    for (i in this.dictionary.KEYWORDS) {
        if (i.length < 2) continue;
        this.autocomplete.register(this.autocomplete.TYPES.keyword, i);
        this.autocomplete.register(this.autocomplete.TYPES.keyword, i.toUpperCase());
    }

    for (i = 0; i < this._execReady.length; i++) {
        this._execReady[i].function.apply(this._execReady[i].this, this._execReady[i].args);
    }
    
    terminal = this;
    initDone();

};*/

/**
 * This function is executed when server instance ready and basic server info is sent to the client.
 */
/*
Terminal.prototype.serverInit = function (data) {

    if (typeof data.system === "string") {
        var nodeInfo = data.system.split(":"); // [PCName, Instance]
        data.node = nodeInfo[0];
        data.instance = nodeInfo[1];
    }

    if (data.node && data.instance) {
        document.title = (data.name ? data.name + " " : "") + data.instance
            + " (" + data.node + ")" + " - Caché WEB Terminal";
        this.output.print(this.localization.get(
            data.name ? 55 : 54, data.node, data.instance, data.name ? data.name : undefined
        ) + "\r\n");
    }

};*/

/**
 * Function to register execution of other functions when terminal in ready state. (when all
 * modules loaded)
 *
 * @param thisArg
 * @param {function} callback
 * @param {Array} [args]
 */
/*
Terminal.prototype.execReady = function (thisArg, callback, args) {

    this._execReady.push({
        function: callback,
        this: thisArg,
        args: args
    });

};*/

/**
 * Resets terminal settings.
 */
/*
Terminal.prototype.reset = function () {

    var _this = this;

    this.output.printSync(this.localization.get(9) + "\r\n");

    window.addEventListener("beforeunload", function () {
        _this.storage.clear();
    })

};*/