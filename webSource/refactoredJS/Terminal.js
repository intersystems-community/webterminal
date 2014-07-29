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
 */
var Terminal = function () {

    //                                         constants                                          \\

    /**
     * Terminal mode constants.
     *
     * @type {{NORMAL: number, CLEAR_IO: number, SQL: number, MACRO: number, DEFAULT: number,
     *       LAST: number}}
     */
    this.MODE = {
        NORMAL: 0, // executing commands on server
        CLEAR_IO: 3,// real-time execution (while messaging) mode until /END/ from server
        SQL: 1, // executing sql queries
        MACRO: 2, // macro recording (set of commands)
        DEFAULT: 0, // default terminal mode
        LAST: 0 // determines last switched mode (functional, do not change)
    };

    /**
     * Client action constants for server's response first byte.
     *
     * @type {{NONE: string, ENTER_CLEAR_IO: string, EXIT_CLEAR_IO: string, OUTPUT: string,
     *       CHANGE_NAMESPACE: string, LOAD_AUTOCOMPLETE: string, READ_STRING: string,
     *       READ_CHARACTER: string, AUTHORIZATION_STATUS: string, WATCH: string,
     *       LOGIN_INFO: string}}
     */
    this.CLIENT_ACTION = {
        NONE: String.fromCharCode(0), // useless action
        ENTER_CLEAR_IO: String.fromCharCode(1), // enters clear IO. In this mode terminal won't send action id
        EXIT_CLEAR_IO: String.fromCharCode(2), // exits clear IO
        OUTPUT: String.fromCharCode(3), // just outputs message body
        CHANGE_NAMESPACE: String.fromCharCode(4), // changes namespace
        LOAD_AUTOCOMPLETE: String.fromCharCode(5), // loads autocomplete file. Body holds only namespace
        READ_STRING: String.fromCharCode(6), // reads string - removes namespace like in common terminal
        READ_CHARACTER: String.fromCharCode(7), // reads character - removes namespace like in common terminal
        AUTHORIZATION_STATUS: String.fromCharCode(8), // alerts client about authorization success. Holds 1/0
        WATCH: String.fromCharCode(9), // start watching
        LOGIN_INFO: String.fromCharCode(10) // output information about login
    };

    /**
     * Server action constants for client's first byte in message.
     *
     * @type {{NONE: string, EXECUTE: string, EXECUTE_SQL: string, GENERATE_AUTOCOMPLETE: string,
     *       WATCH: string, CHECK_WATCH: string, RESET: string, ECHO: string}}
     */
    this.SERVER_ACTION = {
        NONE: String.fromCharCode(0),
        EXECUTE: String.fromCharCode(1),
        EXECUTE_SQL: String.fromCharCode(2),
        GENERATE_AUTOCOMPLETE: String.fromCharCode(3),
        WATCH: String.fromCharCode(4),
        CHECK_WATCH: String.fromCharCode(5),
        RESET: String.fromCharCode(6),
        ECHO: String.fromCharCode(7)
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
     * Defines current mode of terminal.
     *
     * @type {number}
     * @private
     */
    this._mode = this.MODE.NORMAL;

    /**
     * Shows terminal ready state.
     *
     * @type {boolean}
     * @private
     */
    this._ready = false;

    //                                      modules / plugins                                     \\

    /**
     * @type {TerminalElements}
     */
    this.elements = new TerminalElements(document.body);

    /**
     * @type {TerminalLocalization}
     */
    this.localization = new TerminalLocalization();

    /**
     * @type {TerminalStorage}
     */
    this.storage = new TerminalStorage();

    /**
     * @type {TerminalLanguage}
     */
    this.language = new TerminalLanguage();

};

/**
 * Saves terminal state to local storage.
 */
Terminal.prototype.saveState = function () {

    // todo: refactor & uncomment
    //this.storage.set("history", terminal.history.exportJSON());
    this.storage.set("language", this.language.exportJSON());
    //this.storage.set("favorites", terminal.favorites.export());
    //this.storage.set("definitions", terminal.definitions.export());
    //this.storage.set("settings", settings.export());
    this.storage.setLastSaveDate(new Date());
    terminal.output.write(this.localization.get(6));

};