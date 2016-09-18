import special from "./special";
import * as input from "./index";
import * as output from "../output";
import * as locale from "../localization";
import * as server from "../server";
import { Terminal } from "../index";
import * as terminal from "../index";
import * as config from "../config";

export default {
    special: (value, lexemes) => {
        terminal.onUserInput(value, Terminal.prototype.MODE_SPECIAL);
        let secondVal = (lexemes[1] || {}).value,
            result = undefined;
        input.clear();
        if (typeof special[secondVal] === "function") {
            output.print(`\r\n`);
            result = special[secondVal](lexemes);
            output.print(`\r\n`);
        } else {
            if (typeof secondVal === "undefined")
                output.print(`\r\n${ locale.get(`askEnSpec`) }\r\n`);
            else
                output.print(`\r\n${ locale.get(`noSpecComm`, secondVal) }\r\n`);
        }
        if (result !== false)
            input.reprompt();
    },
    normal: (value, lexemes, mode) => {
        terminal.onUserInput(value, mode);
    },
    sql: (value) => {
        let max = config.get(`sqlMaxResults`);
        terminal.onUserInput(value, Terminal.prototype.MODE_SQL);
        output.newLine();
        server.send("SQL", { sql: value, max: max }, (data) => {
            if (data.error) {
                output.printLine(`\x1b[(wrong)m${ locale.parse(data.error) }\x1b[0m`);
            } else {
                data.headers = data.headers || [];
                data.data = data.data || [];
                let html = [`<table><thead><tr><th>`, data.headers.join(`</th><th>`),
                    `</th></tr></thead><tbody><tr>`, data.data.slice(0, max).map(r =>
                    `<td>` + (r || []).join(`</td><td>`) + `</td>`).join(`</tr><tr>`),
                    `</tr>`, data.data.length >= max
                        ? `<tr><td colspan="${ data.headers.length }">${
                        locale.get(`sqlMaxRows`, max) }</td></tr>` : data.data.length === 0
                        ? `<tr><td colspan="${ data.headers.length }">${ locale.get("sqlNoData")
                        }</td></tr>` : ``, `</tbody></table>`];
                output.printLine(`\r\n\x1b!<HTML>${ html.join("") }</HTML>`);
            }
            input.prompt(`${ terminal.NAMESPACE }:SQL > `);
        });
    }
}