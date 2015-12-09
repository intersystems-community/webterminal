/**
 * Main controller object for terminal application.
 *
 * @author ZitRo
 *
 * Architecture:
 *
 *    Globals - Some global definitions.
 *       ║
 *       ║           {CacheWebTerminalServer} - Default server adapter for InterSystems Caché.
 *       ║                      ║
 *       ╔ {TerminalController} ╣ - Controller, object that implements terminalQuery function and
 *       ║                      ║   uses terminal API for interaction with terminal application.
 *       ║                      ║
 *       ║                      ╠ {CacheAutocompleteController} - Stores and controls autocomplete.
 *       ║                      ╚ {CacheTracing} - Mechanism that controls tracing.
 *       ║
 *   {Terminal}
 *       ║
 *       ╠ {TerminalInitialDictionary} - Initial keywords of terminal.
 *       ╠ {TerminalElements} - Handles terminal DOM elements and elements structure. Modules can
 *       ║                      access this elements.
 *       ╠ {TerminalLocalization} - Object-database that obtain localizations.
 *       ╠ {TerminalStorage} - Persistent storage adapter for saving data.
 *       ╠ {TerminalFavorites} - Handles favored commands.
 *       ╠ {TerminalAutocomplete} - Holds autocomplete mechanism for terminal.
 *       ╠ {TerminalOutput} - Output mechanism of terminal.
 *       ║       ╚ {TerminalOutputLine} - Representation of one terminal line of text.
 *       ╠ {TerminalInput}
 *       ║       ╚ {TerminalInputCaret} - Visible caret.
 *       ║       ╚ {TerminalInputHistory} - Terminal command history.
 *       ╠ {TerminalHint} - Represents a floating string of text inside terminal.
 *       ╠ {TerminalDictionary} - All lexemes that form autocomplete database.
 *       ╠ {TerminalTheme} - Appearance controller for terminal.
 *       ╠ {TerminalParser} - Additional module highlighting the syntax.
 *       ╠ {TerminalIndicator} - Indicates command execution progress.
 *       ╚ {TerminalFavorites} - Favorites storage.
 *
 *
 * @param setting {{
 *     controller: TerminalController,
 *     [container]: HTMLElement,
 *     defaultNamespace: string
 * }}
 */
var Terminal = function (setting) {

    /**
     * @type {string}
     */
    this.VERSION = "(dev)"/*build.replace:"pkg.version"*/;

    /**
     * @type {number}
     */
    this.RELEASE_NUMBER = 0/*build.replace:pkg.releaseNumber*/;

    /**
     * @type {Array} of { function: function () {}, this: Object, args: Array }
     * @private
     */
    this._execReady = [];

    //                                      modules / plugins                                     \\

    /**
     * Independent module. Keep on top.
     *
     * @type {TerminalStorage}
     */
    this.storage = new TerminalStorage();

    /**
     * Uses storage.
     *
     * @type {TerminalLocalization}
     */
    this.localization = new TerminalLocalization(this);

    /**
     * @type {TerminalInitialDictionary}
     */
    this.dictionary = new TerminalInitialDictionary();

    /**
     * @type {TerminalSettings}
     */
    this.settings = new TerminalSettings(this);

    /**
     * @type {TerminalAutocomplete}
     */
    this.autocomplete = new TerminalAutocomplete();

    this.SETUP = {
        defaultNamespace: setting["defaultNamespace"] || "",
        controller: setting["controller"] || new TerminalController(this),
        container: setting["container"] || document.body,
        authKey: setting["authKey"] || null
    };

    /**
     * Keep on the top of other terminal-dependent modules.
     *
     * @type {TerminalElements}
     */
    this.elements = new TerminalElements(this.SETUP.container);

    /**
     * @type {TerminalIndicator}
     */
    this.progressIndicator = new TerminalIndicator(this);

    /**
     * @type {TerminalTheme}
     */
    this.theme = new TerminalTheme(this);

    /**
     * @type {TerminalParser}
     */
    this.parser = new TerminalParser(this);

    /**
     * @type {TerminalOutput}
     */
    this.output = new TerminalOutput(this);

    /**
     * @type {TerminalInput}
     */
    this.input = new TerminalInput(this);

    /**
     * @type {TerminalFavorites}
     */
    this.favorites = new TerminalFavorites(this);

    /**
     * @type {TerminalDefinitions}
     */
    this.definitions = new TerminalDefinitions(this);

    /**
     * @type {TerminalController|*}
     */
    this.controller = this.SETUP.controller;

    this.initialize();

};

Terminal.prototype.initialize = function () {

    var i;

    for (i in this.controller.internalCommands) {
        this.autocomplete.register(this.autocomplete.TYPES.keyword, "/" + i);
    }

    for (i in this.dictionary.KEYWORDS) {
        if (i.length < 2) continue;
        this.autocomplete.register(this.autocomplete.TYPES.keyword, i);
        this.autocomplete.register(this.autocomplete.TYPES.keyword, i.toUpperCase());
    }

    for (i = 0; i < this._execReady.length; i++) {
        this._execReady[i].function.apply(this._execReady[i].this, this._execReady[i].args);
    }

};

/**
 * Function to register execution of other functions when terminal in ready state. (when all
 * modules loaded)
 *
 * @param thisArg
 * @param {function} callback
 * @param {Array} [args]
 */
Terminal.prototype.execReady = function (thisArg, callback, args) {

    this._execReady.push({
        function: callback,
        this: thisArg,
        args: args
    });

};

/**
 * Resets terminal settings.
 */
Terminal.prototype.reset = function () {

    var _this = this;

    this.output.printSync(this.localization.get(9) + "\r\n");

    window.addEventListener("beforeunload", function () {
        _this.storage.clear();
    })

};