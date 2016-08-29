import * as output from "../output";
import * as input from "../input";
import * as server from "./index";
import * as terminal from "../index";
import * as locale from "../localization";
import * as config from "../config";
import * as analytics from "../analytics";

export function init (data = {}) {
    if (config.get("initMessage")) {
        output.printLine(`CWTv${ terminal.VERSION } ${ data["system"] }:\x1b[(keyword)m${
            data["username"] }\x1b[0m${ data["name"] ? ` (${ data["name"] })` : `` }`);
        if (data["firstLaunch"])
            output.printLine(locale.get(`firstLaunchMessage`));
    }
    analytics.collect(data);
    config.set(`serverName`, data["name"], true);
    document.title = `${ data["name"] || data["system"] } - WebTerminal`;
    terminal.authDone();
}

export function prompt (namespace) {
    terminal.NAMESPACE = namespace;
    input.prompt(`${ namespace } > `, {}, (str) => {
        server.send("Execute", str);
    });
}

export function execError (message = "") {
    output.print(
        message.replace(/^(<.*>)/, `\x1b[31m$1\x1b[0m`)
            .replace(/zLoop\+[0-9]+\^WebTerminal\.Core\.[0-9]+/, "")
    );
}

export function error (message = "") {
    output.print(`\x1b[31m${ locale.parse(message) }\x1b[0m`);
}

export function readString (data = {}) {
    input.prompt("", data, (str) => {
        server.send("i", str);
    }, false);
}

export function readChar (data = {}) {
    input.getKey(data, (code) => {
        server.send("i", code);
    });
}

/**
 * Output data.
 * @param {string} text
 */
export function o (text = "") {
    output.print(text);
}

export function oLocalized (text = "") {
    output.print(locale.parse(text));
}