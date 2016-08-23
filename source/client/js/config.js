import * as storage from "./storage";
import * as locale from "./localization";
import { onInit } from "./init";

const STORAGE_NAME = `terminal-config`;
const boolean = ["true", "false"],
      boolTransform = (a) => a === `true`;

const metadata = { // those keys that are not listed in this object are invalid ones
    updateCheck: {
        default: true,
        values: boolean,
        transform: boolTransform
    },
    language: {
        default: locale.suggestLocale(),
        values: locale.getLocales()
    },
    initMessage: {
        default: true,
        values: boolean,
        transform: boolTransform
    },
    suggestions: {
        default: true,
        values: boolean,
        transform: boolTransform
    },
    syntaxHighlight: {
        default: true,
        values: boolean,
        transform: boolTransform
    }
};

let defaults = {};
for (let p in metadata)
    defaults[p] = metadata[p].default;

let config =
    (Object.assign(Object.assign({}, defaults), JSON.parse(storage.get(STORAGE_NAME)) || {}));

onInit(() => locale.setLocale(config.language));

export function get (key) {
    return typeof config[key] === "undefined" ? null : config[key];
}

/**
 * @param {Set} updated
 */
function onUpdate (updated) {
    if (updated.has("language")) {
        locale.setLocale(config.language);
    }
    storage.set(STORAGE_NAME, JSON.stringify(config));
}

/**
 *
 * @param {string} key
 * @param {*} value
 * @returns {String} - Error message or an empty string if no errors happened.
 */
export function set (key, value) {
    if (!metadata.hasOwnProperty(key))
        return locale.get(`confNoKey`, key);
    if (metadata[key].values && metadata[key].values.indexOf(value) === -1)
        return locale.get(`confInvVal`, key,
            metadata[key].values.map(v => `\x1b[(constant)m${ v }\x1b[0m`).join(", "));
    config[key] = metadata[key].transform ? metadata[key].transform(value) : value;
    onUpdate(new Set([key]));
    return "";
}

export function reset () {
    config = Object.assign({}, defaults);
    onUpdate(new Set(Object.keys(metadata)));
}

export function list () {
    return Object.assign({}, config);
}