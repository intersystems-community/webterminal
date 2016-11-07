import * as locale from "../localization";
import * as output from "../output";
import * as input from "../input";
import * as config from "../config";
import * as terminal from "../index";
import * as server from "../server";
import * as tracing from "../tracing";
import * as favorite from "../favorite";
import { prompt } from "../server/handlers";
import { Terminal } from "../index";
import { checkUpdate } from "../network";

function tableObject (keyHeader, valHeader, object) {
    let longest = keyHeader.length + 2;
    for (let p in object) if (p.length > longest) longest = p.length;
    output.print(
        `\x1b[1m${ keyHeader }\x1b[0m\x1b[${ longest }G  \x1b[1m${ valHeader }\x1b[0m\r\n`
    );
    for (let p in object) {
        output.print(`\x1b[(constant)m${ p }\x1b[0m\x1b[${ longest }G= ${ object[p] }\r\n`);
    }
}

/**
 * Special commands handler. Each key of this object is a command of type "/<key>".
 * Please, keep items ordered alphabetically.
 */
export default {
    "help": () => {
        output.print(locale.get(`help`) + `\r\n`);
    },
    "clear": () => {
        output.reset();
    },
    "config": (strings) => {

        let out = (list, pad, global) => {
            for (let p in list) {
                if (list[p].global !== global)
                    continue;
                let val = typeof list[p].value === "string" && list[p].value.length === 0
                    ? `\x1b[(string)m""\x1b[0m`
                    : `\x1b[(constant)m${ list[p].value }\x1b[0m`;
                output.print(`\x1b[(variable)m${ p }\x1b[0m\x1b[${ pad }G= ${ val }\r\n`);
            }
        };

        if (strings.length < 4) {
            let list = config.list(),
                longest = 0;
            for (let p in list) if (p.length > longest) longest = p.length;
            longest += 2;
            output.print(`${ locale.get(`availConfLoc`) }\r\n`);
            out(list, longest, false);
            output.print(`${ locale.get(`availConfGlob`) }\r\n`);
            out(list, longest, true);
            output.print(`${ locale.get(`confHintSet`) }\r\n`);
            return;
        }
        let defaults = strings.filter(v => v.class === "global")[0];
        if (defaults) {
            config.reset();
            return;
        }
        if (strings.length < 5) {
            output.print(`${ locale.get(`confHintSet`) }\r\n`);
            return;
        }
        let key = strings.filter(v => v.class === "variable")[0],
            val = strings.filter(v => v.class === "constant" || v.class === "string")[0];
        if (!key || !val) {
            output.print(`${ locale.get(`confHintSet`) }\r\n`);
            return;
        }
        let res = config.set(
            key.value,
            val.class === "string" ? val.value.substr(1, val.value.length - 2) : val.value
        );
        if (res !== "")
            output.print(`${ res }\r\n`);
    },
    "favorite": (chain) => {
        if (chain.length < 4) {
            let list = favorite.list();
            if (Object.keys(list).length > 0) {
                tableObject(locale.get(`favKey`), locale.get(`favVal`), list);
                output.newLine();
            }
            output.print(locale.get(`favDesc`) + `\r\n`);
            return;
        }
        if (chain[3].value === "delete") {
            if (chain[4] && chain[4].value === " " && chain[5]) {
                let result = favorite.clear(chain[5].value);
                output.print(locale.get(`favDel${ result ? "OK" : "NotOK" }`, chain[5].value)
                    + `\r\n`);
            } else {
                favorite.clear();
                output.print(locale.get(`favDel`) + `\r\n`);
            }
            return;
        }
        if (chain.length < 6) {
            let val = favorite.get(chain[3].value);
            if (val)
                setTimeout(() => input.setValue(val), 1);
            else
                output.print(locale.get(`noFav`, chain[3].value) + `\r\n`);
        }
        let s = chain.slice(5).map(e => e.value).join("");
        if (s && chain[3].value) {
            favorite.set(chain[3].value, s);
            output.print(locale.get(`favSet`, chain[3].value) + `\r\n`);
        }
    },
    "info": () => {
        output.print(locale.get(`info`) + `\r\n`);
    },
    "logout": () => {
        let outcome;
        try { outcome = document.execCommand("ClearAuthenticationCache") } catch(e) {}
        if (!outcome) {
            outcome = ((x) => {
                if (!x) return;
                if (x) {
                    x.open("HEAD", location.href, true, "logout",
                        (new Date()).getTime().toString());
                    x.send("");
                    return true;
                } else {
                    return false;
                }
            })(window.XMLHttpRequest
                ? new window.XMLHttpRequest()
                : ( window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : null ))
        }
        if (!outcome) {
            output.printLine(locale.get("unLogOut"));
        } else {
            output.printLine(locale.get("logOut"));
            location.reload();
        }
    },
    "sql": () => {
        let sql = terminal.MODE !== Terminal.prototype.MODE_SQL;
        terminal.MODE = !sql ? Terminal.prototype.MODE_PROMPT : Terminal.prototype.MODE_SQL;
        if (sql)
            input.prompt(`${ terminal.NAMESPACE }:SQL > `);
        else
            prompt(terminal.NAMESPACE);
        return false;
    },
    "trace": (strings) => {
        if (strings.length < 4) {
            output.print(locale.get(`tracingUsage`) + `\r\n`);
            let list = tracing.getList();
            if (list) {
                output.print(locale.get(`traceSight`, list) + `\r\n`);
            }
            return;
        }
        if (strings[3].value === "stop") {
            server.send("StopTracing", {}, (res = { OK: false }) => {
                if (res.OK) tracing.stop();
                output.printAsync(`${ locale.get(res.OK ? "traceStopOK" : "traceStopNotOK") }\r\n`);
            });
            return;
        }
        let watchFor = strings.slice(3).map(e => e.value).join("");
        server.send("Trace", watchFor, (res = { OK: 0 }) => {
            if (!res.OK) {
                output.printAsync(`${ locale.get("traceBad", watchFor) }\r\n`);
                return;
            }
            if (res["started"]) {
                tracing.start(watchFor);
                output.printAsync(`${ locale.get("traceStart", watchFor) }\r\n`);
                return;
            }
            if (res["stopped"]) {
                tracing.stop(watchFor);
                output.printAsync(`${ locale.get("traceStop", watchFor) }\r\n`);
            }
        });
    },
    "update": () => {
        checkUpdate();
    }
}
