import * as output from "../output";
import * as input from "../input";
import * as server from "./index";
import * as terminal from "../index";
import * as locale from "../localization";
import * as config from "../config";
import * as analytics from "../analytics";

export function init (data = {}) {
    if (config.get("initMessage") && !data["cleanStart"]) {
        output.printLine(`CWTv${ terminal.VERSION } ${ data["system"] }:\x1b[(keyword)m${
            data["username"] }\x1b[0m${ data["name"] ? ` (${ data["name"] })` : `` }`);
        if (data["firstLaunch"])
            output.printLine(locale.get(`firstLaunchMessage`));
    }
    if (data["cleanStart"]) config.setTemp("updateCheck", "false");
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

export function promptCallback (data) {
    terminal.promptCallback(data);
}

function cleanCWTLabel (string) {
    let s = string.replace(/(\w+(?:\+[0-9]+)?\^(?:\w\.?)+)/, "\x1b[(special)m$1\x1b[0m")
        .replace(/^(<.*>)/, `\x1b[31m$1\x1b[0m`),
        ss = s.replace(/z\w+\+[0-9]+\^WebTerminal\.\w+\.[0-9]+/, "");
    return {
        string: ss,
        internal: ss.length !== s.length
    };
}

export function execError (message = "") {
    let textToPrint = [""];
    if (typeof message === "object") {
        let label = cleanCWTLabel(message["zerror"] || "?");
        textToPrint.push(label.string);
        if (!label.internal) {
            let source = message.source.split(/\n/g);
            for (let line = 0; line < source.length; line++) {
                let e = line === message.line;
                textToPrint.push(
                    `\x1b[${ e ? "(wrong)" : "(special)" }m${ e ? "╠" : "║" }\x1b[0m`
                    + (e ? "\x1b[(wrong)m" : "")
                    + source[line]
                    + (e ? "\x1b[0m" : "")
                );
            }
        }
    } else {
        textToPrint.push(cleanCWTLabel(message).string);
    }
    output.printAsync(textToPrint.join("\r\n") + "\r\n");
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