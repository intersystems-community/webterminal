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
 *       ╔ {TerminalController} ╝ - Controller, object that implements terminalQuery function and
 *       ║                           uses terminal API for interaction with terminal application.
 *       ║
 *   {Terminal}
 *       ║
 *    Modules
 *       ║
 *       ╠ {TerminalElements} - Handles terminal DOM elements and elements structure. Modules can
 *       ║                      access this elements.
 *       ╠ {TerminalLocalization} - Object-database that obtain localizations.
 *       ╠ {TerminalStorage} - Persistent storage adapter for saving data.
 *       ╠ {TerminalOutput} - Output mechanism of terminal.
 *       ║        ╚ {TerminalOutputLine} - Representation of one terminal line of text.
 *       ╠ {TerminalInput}
 *       ║       ╚ {TerminalInputCaret} - Visible caret.
 *       ║       ╚ {TerminalInputHistory} - Terminal command history.
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

    if (!setting) setting = {
        controller: new TerminalController(this)
    };

    //                                      modules / plugins                                     \\

    /**
     * Keep on the top of other modules.
     *
     * @type {TerminalElements}
     */
    this.elements = new TerminalElements(setting.container || document.body);

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
     * @type {TerminalDictionary}
     */
    this.dictionary = new TerminalDictionary();

    /**
     * @type {TerminalFavorites}
     */
    this.favorites = new TerminalFavorites();

    /**
     * @type {TerminalController}
     */
    this.controller = new TerminalController(this);

    this.initialize();

};

Terminal.prototype.initialize = function () {



};

/**
 * Saves terminal state to local storage.
 */
Terminal.prototype.saveState = function () {

    // todo: refactor & uncomment
    this.storage.set("history", this.input.history.exportJSON());
    this.storage.set("dictionary", this.dictionary.exportJSON());
    this.storage.set("favorites", terminal.favorites.exportJSON());
    //this.storage.set("definitions", terminal.definitions.export());
    //this.storage.set("settings", settings.export());
    this.storage.setLastSaveDate(new Date());
    terminal.output.write(this.localization.get(6));

};

/**
 * Loads terminal state from local storage.
 */
Terminal.prototype.loadState = function () {

    if (!this.storage.getLastSaveDate()) {
        console.warn("Unable to load terminal state: it hasn't been saved before.");
        return;
    }

    this.input.history.importJSON(this.storage.get("history"));
    this.dictionary.importJSON(this.storage.get("dictionary"));
    this.favorites.importJSON(this.storage.get("favorites"));

};

/**
 * Resets terminal state.
 */
Terminal.prototype.resetState = function () {

    this.storage.clear();
    // todo: without refreshing page wipe data and reset settings

};