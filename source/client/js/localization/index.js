import * as storage from "../storage";
import { printLine } from "../output";
import dictionary from "./dictionary";

/**
 * All available locales.
 * @type {String[]} - Two-letter code of the locale.
 */
export let LOCALES = [];

let STORAGE_NAME = "terminal-localization",
    DEFAULT_LOCALE = "en",
    CURRENT_LOCALE = getLocale();

function getLocales () {
    return (() => {
        let locales = [];
        console.log(">", dictionary);
        //noinspection LoopStatementThatDoesntLoopJS
        for (let a in dictionary) {
            for (let b in dictionary[a]) {
                locales.push(b);
            }
            return locales;
        }
    })();
}

export function getLocale () {

    let lang = storage.get(STORAGE_NAME);

    if (LOCALES.length)
        LOCALES = getLocales();

    if (!lang || LOCALES.indexOf(lang) === -1) {
        lang = navigator.language;
        if (LOCALES.indexOf(lang) === -1) {
            lang = DEFAULT_LOCALE;
        }
    }

    return CURRENT_LOCALE = lang;

}

export function setLocale (code) {

    if (LOCALES.indexOf(code) !== -1) {
        CURRENT_LOCALE = code;
        storage.set(STORAGE_NAME, code);
        return true;
    } else {
        printLine(get(`noLocale`, code));
        return false;
    }
    
}

/**
 * Get localized text.
 * @param locId - Translation id.
 * @param args - Any arguments that will be inserted to translation (instead of %s or %n)
 * @returns {String}
 */
export function get (locId, ...args) {

    let i = -1;

    return (
        (dictionary[locId])
            ? dictionary[locId][CURRENT_LOCALE] || `[${ locId }.${ CURRENT_LOCALE }?]`
            : `[${ locId }?]`
    ).replace(/%[sn]/g, function (part) {
        return typeof args[++i] !== "undefined"
            ? ( part.charAt(1) === "s" ? args[i].toString() : parseFloat(args[i]) )
            : part;
    });

}