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
 *       ║                      ╚ {CacheTracing} - Mechanism that controls tracing.
 *       ║
 *   {Terminal}
 *       ║
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
 *       ╚ {TerminalFavorites} - Favorites storage.
 *
 *
 * @param setting {{
 *     controller: TerminalController,
 *     [container]: HTMLElement
 * }}
 */
var Terminal = function (setting) {

    this.SETUP = {
        controller: setting["controller"] || new TerminalController(this),
        container: setting["container"] || document.body
    };

    //                                      modules / plugins                                     \\

    /**
     * Keep on the top of other modules.
     *
     * @type {TerminalElements}
     */
    this.elements = new TerminalElements(this.SETUP.container);

    /**
     * @type {TerminalLocalization}
     */
    this.localization = new TerminalLocalization();

    /**
     * @type {TerminalStorage}
     */
    this.storage = new TerminalStorage();

    /**
     * @type {TerminalOutput}
     */
    this.output = new TerminalOutput(this);

    /**
     * @type {TerminalInput}
     */
    this.input = new TerminalInput(this);

    /**
     * @type {CacheDictionary}
     */
    this.dictionary = new CacheDictionary();

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

    /**
     * @type {TerminalAutocomplete}
     */
    this.autocomplete = new TerminalAutocomplete();

    this.initialize();

};

Terminal.prototype.initialize = function () {

    var i;

    for (i in this.controller.internalCommands) {
        this.autocomplete.register(this.autocomplete.TYPES.keyword, "/" + i);
    }

    for (i in this.dictionary.keywords) {
        this.autocomplete.register(this.autocomplete.TYPES.keyword, this.dictionary.keywords[i]);
        this.autocomplete.register(this.autocomplete.TYPES.keyword, this.dictionary.keywords[i]
            .toUpperCase());
    }

};

/**
 * Resets terminal settings.
 */
Terminal.prototype.reset = function () {

    var _this = this;

    this.output.printSync("Refresh window to apply reset.\r\n");

    window.addEventListener("beforeunload", function () {
        _this.storage.clear();
    })

};