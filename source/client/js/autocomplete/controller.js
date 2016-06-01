import * as storage from "../storage";
import * as settings from "../settings";

/**
 * @deprecated storing autocomplete
 * Storing JSON of type:
 * { "namespace": { class: {...}, global: {...} } }, "otherNamespace": {...}, ...
 */

let STORAGE_NAME = "cacheAutocomplete",
    SYSTEM_CLASSES_LOADED = false;

function init () {

    let stored = storage.get(STORAGE_NAME);

    if (!stored)
        return;

    if (!settings.OPTIONS.AUTOCOMPLETE) return;

    try {
        stored = JSON.parse(stored);
    } catch (e) { console.error(e); return; }

    //output.print(locale.get(52) + " "); // @deprecated
    for (let namespace in stored) {
        registerObject(namespace, stored[namespace]);
    }
    //output.print(locale.get(53) + "\r\n");

}

init();

/**
 * @param {string} namespace - Pass "%" for system classes.
 * @param {{class: Object, global: Object}} object - Object to register in AC database.
 */
function registerObject (namespace, object) {

    var theClass, theGlobal, property,
        stored = this.CONTROLLER.TERMINAL.storage.get(STORAGE_NAME) || "{}";

    for (theClass in object["class"]) {
        this.CONTROLLER.TERMINAL.autocomplete.register(
            this.CONTROLLER.TERMINAL.autocomplete.TYPES.class,
            theClass, namespace === "%" ? undefined : namespace
        );
        for (property in object["class"][theClass]) {
            this.CONTROLLER.TERMINAL.autocomplete.register(
                this.CONTROLLER.TERMINAL.autocomplete.TYPES.subclass,
                property, namespace === "%" ? undefined : namespace,
                [theClass]
            );
        }
    }

    for (theGlobal in object["global"]) {
        this.CONTROLLER.TERMINAL.autocomplete.register(
            this.CONTROLLER.TERMINAL.autocomplete.TYPES.globals,
            theGlobal, namespace === "%" ? undefined : namespace
        );
    }

    if (namespace === "%") SYSTEM_CLASSES_LOADED = true;

    if (stored) try {
        stored = JSON.parse(stored);
        stored[namespace] = object;
        storage.set(STORAGE_NAME, JSON.stringify(stored));
    } catch (e) { console.error(e); }

}