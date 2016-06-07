import * as output from "../output";
import * as input from "../input";
import * as server from "./index";

export function init (data = {}) {
    output.printLine(`Authorized ${ data["system"] } As ${ data["username"] }${
        data["name"] ? ` (${ data["name"] })` : ``
    }`);
}

export function prompt (namespace) {
    input.prompt(`${ namespace } > `, {}, (str) => {
        server.send("execute", str);
    });
}

export function execError (message = "") {
    output.print(
        message.replace(/^(<.*>)/, `\x1b[31m$1\x1b[0m`)
            .replace(/zLoop\+[0-9]+\^WebTerminal\.Core\.[0-9]+/, "")
    );
}

export function readString (data = {}) {
    input.prompt("", data, (str) => {
        server.send("i", str);
    });
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