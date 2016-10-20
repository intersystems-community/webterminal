import * as storage from "./storage";
import * as locale from "./localization";
import * as server from "./server";
import * as output from "./output";
import { onInit } from "./init";

const STORAGE_NAME = `terminal-config`;
const boolean = ["true", "false"],
      temps = {},
      boolTransform = (a) => a === `true`,
      intTransform = (a) => parseInt(a);

const metadata = { // those keys that are not listed in this object are invalid ones
    defaultNamespace: {
        default: ""
    },
    initMessage: {
        default: true,
        values: boolean,
        transform: boolTransform
    },
    language: {
        default: locale.suggestLocale(),
        values: locale.getLocales()
    },
    maxHistorySize: {
        default: 200,
        transform: intTransform
    },
    serverName: {
        default: "",
        global: true
    },
    sqlMaxResults: {
        default: 777,
        transform: intTransform
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
    },
    updateCheck: {
        default: true,
        values: boolean,
        transform: boolTransform,
        onSet: (v) => output.print(v ? ":)" : ":(")
    }
};

let defaults = {};
for (let p in metadata)
    defaults[p] = metadata[p].default;

let config =
    (Object.assign(Object.assign({}, defaults), (() => {
        let o = JSON.parse(storage.get(STORAGE_NAME));
        for (let p in o) { if (!metadata.hasOwnProperty(p)) delete o[p]; }
        return o;
    })() || {}));

onInit(() => locale.setLocale(config.language));

export function get (key) {
    return typeof temps[key] !== "undefined" ? temps[key]
        : typeof config[key] === "undefined" ? null : config[key];
}

/**
 * @param {Set} updated
 */
function onUpdate (updated) {
    if (updated.has("language"))
        locale.setLocale(config.language);
    if (updated.has("serverName"))
        document.title = config.serverName;
    storage.set(STORAGE_NAME, JSON.stringify(config));
}

/**
 * Set the configuration option.
 * @param {string} key
 * @param {*} value
 * @param {boolean} localOnly - Updates only the local values.
 * @returns {String} - Error message or an empty string if no errors happened.
 */
export function set (key, value, localOnly = false) {
    if (!metadata.hasOwnProperty(key))
        return locale.get(`confNoKey`, key);
    if (metadata[key].values && metadata[key].values.indexOf(value) === -1)
        return locale.get(`confInvVal`, key,
            metadata[key].values.map(v => `\x1b[(constant)m${ v }\x1b[0m`).join(", "));
    let v = metadata[key].transform ? metadata[key].transform(value) : value,
        oldConfig = config[key];
    if (!localOnly && metadata[key] && metadata[key].global) {
        server.send(`${ key }ConfigSet`, v, (ok) => {
            if (ok === 1)
                return;
            config[key] = oldConfig;
            onUpdate(new Set([key]));
        });
    }
    config[key] = v;
    if (metadata[key].onSet)
        metadata[key].onSet(v);
    onUpdate(new Set([key]));
    return "";
}

/**
 * Sets the option only for the current session.
 * @param {string} key
 * @param {*} value
 */
export function setTemp (key, value) {
    if (!metadata.hasOwnProperty(key)
        || (metadata[key].values && metadata[key].values.indexOf(value) === -1))
        return;
    temps[key] = metadata[key].transform ? metadata[key].transform(value) : value;
}

export function reset () {
    for (let p in config) {
        if (metadata[p] && !metadata[p].global)
            config[p] = metadata[p].default;
    }
    onUpdate(new Set(Object.keys(metadata)));
}

export function list () {
    let o = {};
    for (let p in config) {
        o[p] = {
            value: config[p],
            global: !!metadata[p].global
        };
    }
    return o;
}