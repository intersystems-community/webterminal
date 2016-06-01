import * as output from "../output";
import * as input from "../input";
import * as server from "./index";

export function init (data = {}) {
    output.printLine(`Authorized ${ data["system"] } As ${ data["username"] }${
        data["name"] ? ` (${ data["name"] })` : ``
    }`);
}

export function prompt (namespace) {
    input.prompt(`${ namespace } > `, (str) => {
        server.send("execute", str);
    });
}

/**
 * Output data.
 * @param {string} text
 */
export function o (text = "") {
    output.print(text);
}