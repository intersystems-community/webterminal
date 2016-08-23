import * as locale from "../localization";
import * as output from "../output";
import * as config from "../config";

/**
 * Special commands handler. Each key of this object is a command of type "/<key>".
 */
export default {
    "help": () => {
        output.print(locale.get(`help`) + `\r\n`);
    },
    "info": () => {
        output.print(locale.get(`info`) + `\r\n`);
    },
    "config": (string) => {

        let out = (list, pad, global) => {
            for (let p in list) {
                if (list[p].global !== global)
                    continue;
                output.print(`\x1b[(variable)m${ p }\x1b[0m\x1b[${ pad }G= \x1b[(constant)m${
                    list[p].value }\x1b[0m\r\n`);
            }
        };

        if (string.length < 4) {
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
        let defaults = string.filter(v => v.class === "global")[0];
        if (defaults) {
            config.reset();
            return;
        }
        if (string.length < 5) {
            output.print(`${ locale.get(`confHintSet`) }\r\n`);
            return;
        }
        let key = string.filter(v => v.class === "variable")[0],
            val = string.filter(v => v.class === "constant" || v.class === "string")[0];
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
    }
}
