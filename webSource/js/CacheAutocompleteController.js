/**
 * Object manipulates storage of autocomplete data.
 *
 * todo: debug, "terminal.onReady"
 * @param {TerminalController} CONTROLLER
 * @constructor
 */
var CacheAutocompleteController = function (CONTROLLER) {

    /**
     * @type {TerminalController}
     */
    this.CONTROLLER = CONTROLLER;

    /**
     * @type {TerminalLocalization}
     * @private
     */
    this._lc = CONTROLLER.TERMINAL.localization;

    /**
     * Shows if system classes in-memory.
     *
     * @type {boolean}
     */
    this.SYSTEM_CLASSES_LOADED = false;

    this.initialize();

};

/* Storing JSON of type:
 * { "namespace": { class: {...}, global: {...} } }, "otherNamespace": {...}, ...
 */
CacheAutocompleteController.prototype.STORAGE_NAME = "cacheAutocomplete";

CacheAutocompleteController.prototype.initialize = function () {

    var stored = this.CONTROLLER.TERMINAL.storage.get(this.STORAGE_NAME),
        _this = this,
        namespace;

    if (stored) this.CONTROLLER.TERMINAL.execReady(this, function () {

        if (!_this.CONTROLLER.TERMINAL.settings.AUTOCOMPLETE) return;

        try {
            stored = JSON.parse(stored);
        } catch (e) { console.error(e); return; }
        _this.CONTROLLER.TERMINAL.output.print(_this._lc.get(52) + " ");
        _this.CONTROLLER.TERMINAL.output.getCurrentLine().render();
        for (namespace in stored) {
            _this.registerObject(namespace, stored[namespace]);
        }
        _this.CONTROLLER.TERMINAL.output.print(_this._lc.get(53) + "\r\n");

    });

};

/**
 * @param {string} namespace - Pass "%" for system classes.
 * @param {{class: Object, global: Object}} object - Object to register in AC database.
 */
CacheAutocompleteController.prototype.registerObject = function (namespace, object) {

    var theClass, theGlobal, property,
        stored = this.CONTROLLER.TERMINAL.storage.get(this.STORAGE_NAME) || "{}";

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

    if (namespace === "%") this.SYSTEM_CLASSES_LOADED = true;

    if (stored) try {
        stored = JSON.parse(stored);
        stored[namespace] = object;
        this.CONTROLLER.TERMINAL.storage.set(this.STORAGE_NAME, JSON.stringify(stored));
    } catch (e) { console.error(e); }

};