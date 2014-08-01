/**
 * Main controller object for terminal application.
 *
 * @author ZitRo
 *
 * Required objects:
 *  TerminalStorage
 *
 * Cache terminal protocol over-WebSocket description (CTWPv3):
 *
 *  AUTHORIZATION:
 *      First package from client includes ONLY authorization key in clear text form. If this key is
 *      invalid, server closes connection immediately. If server accepts key, main terminal session
 *      starts.
 *
 *  MESSAGING:
 *      Every client-server package (except clear I/O mode) includes one action-identifier byte.
 *      This byte tells what to perform on received side. The next table of action bytes are in use:
 *
 *      BYTE    SERVER received                             CLIENT received
 *      0       Ignore body                                 Ignore body
 *      1       Execute body                                Enter clear I/O mode (execution begins)
 *      2       Execute sql body                            Exit clear I/O mode (with "exit" body)
 *      3       Generate autocomplete (body - flag)         Output message
 *      4       Watch (body: name)                          Change namespace
 *      5       Check watches                               Load autocomplete
 *      6       RESET to default                            Read string
 *      7       ECHO (body)                                 Read char
 *      8                                                   Authorization status (body: 1/0)
 *      9                                                   Watch (body: name)
 *		10													LoginInfo (body: user logged in)
 *
 *	Clear I/O mode
 *      In this mode terminal client will listen for data from server and output any data as it is,
 *      without any action identifiers. The same with terminal: any data sent to server won't
 *      include any identifiers.
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

    //                                      local variables                                      \\

    /**
     * Defines data handler for server data. If the function return false, data won't be processed
     * by the terminal.
     *
     * @type {function|null}
     * @private
     */
    this._receiveDataHandler = null;

    /**
     * Shows terminal ready state.
     *
     * @type {boolean}
     * @private
     */
    this._ready = false;

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