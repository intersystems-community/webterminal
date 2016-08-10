import { get } from "../lib";
import * as input from "../input";
import * as terminal from "../index";
import * as output from "../output";
import * as locale from "../localization";
import "./update";

get("http://intersystems-ru.github.io/webterminal/terminal.json", (data = {}) => {
    if (data.error || typeof data[`motd`] === "undefined")
        return;
    terminal.onAuth(() => handleNetworkData(data));
});

function handleNetworkData (data) {
    input.clearPrompt();
    // console.log(data);
    if (data[`motd`])
        output.printLine(data[`motd`]);
    if (data[`versions`] instanceof Array)
        checkUpdate(data[`versions`]);
    input.reprompt();
}

// console.log(terminal);

/**
 * Parses an array received from WebTerminal's home server.
 * @param versions
 */
function checkUpdate (versions) {
    let changes = [],
        hiVersion = "",
        updateURL = "";
    versions.forEach((version) => {
        // console.log(version.v, terminal.VERSION, versionGT(version.v, terminal.VERSION));
        if (!versionGT(version.v, terminal.VERSION))
            return;
        (version[`changes`] || []).forEach((c, i) => changes.push(
            "\x1b[2m"
            + ((i === 0 ? version.v : "") + `${ i === 0 ? ":" : "" }                        `)
                .substring(0, 16) + "\x1b[0m"
            + (typeof c === `string` ? c : c[`text`] || "")
        ));
        if (versionGT(version.v, hiVersion)) {
            hiVersion = version.v;
            updateURL = version.url;
        }
    });
    if (!changes.length)
        return;
    output.printLine(locale.get(
        `updReady`,
        `javascript:window.updateTerminal("${ hiVersion }","${ updateURL }")` // no spaces here!
    ));
    if (!updateURL) {
        output.printLine(
            locale.get(`noUpdUrl`, `http://intersystems-ru.github.io/webterminal/#downloads`)
        );
        return;
    }
    output.printLine(changes.join(`\r\n`));
}

/**
 * Semantic versioning versions compare.
 * @param {string} high
 * @param {string} low
 * @returns {boolean}
 */
function versionGT (high, low) {
    let v1 = high.split(/[\-\.]/g),
        v2 = low.split(/[\-\.]/g);
    for (let i = 0; i < v1.length; i++) {
        if (isNaN(+v1[i]) || isNaN(+v2[i])) {
            if (v1[i] > v2[i])
                return true;
            else if (v1[i] < v2[i])
                return false;
        } else {
            if (+v1[i] > +v2[i])
                return true;
            else if (+v1[i] < +v2[i])
                return false;
        }
    }
    return v2.length > v1.length;
}

window.versionGT = versionGT;