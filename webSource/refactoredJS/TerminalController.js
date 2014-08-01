/**
 * Terminal controller instance handles input from terminal and converts data between server and
 * terminal application.
 *
 * todo: rebuild server-client IO to event-driven.
 * @param {Terminal} TERMINAL
 * @constructor
 */
var TerminalController = function (TERMINAL) {

    /**
     * @type {Terminal}
     */
    this.TERMINAL = TERMINAL;

    /**
     * todo: remove debug parameter
     * @type {CachéWebTerminalServer}
     */
    this.server = new CachéWebTerminalServer(this, location.host, "57772");

    /**
     * @type {string}
     */
    this.NAMESPACE = "UNAUTHORIZED";

    /**
     * Defines current mode of terminal.
     *
     * @type {number}
     * @private
     */
    this._mode = this.MODE.UNAUTHORIZED;

};

/**
 * Processing mode constants.
 *
 * @type {{UNAUTHORIZED: number, EXECUTE: number, CLEAR_IO: number, SQL: number, MACRO: number}}
 */
TerminalController.prototype.MODE = {
    UNAUTHORIZED: 0, // client not authorized, listening for CLIENT_ACTION.AUTHORIZATION_STATUS
    EXECUTE: 1, // executing commands on server
    CLEAR_IO: 2,// real-time execution (while messaging) mode until /END/ from server
    SQL: 3, // executing sql queries
    MACRO: 4 // macro recording (set of commands)
};

/**
 * Client action constants for server's response first byte.
 *
 * @type {{NONE: string, ENTER_CLEAR_IO: string, EXIT_CLEAR_IO: string, OUTPUT: string,
 *       CHANGE_NAMESPACE: string, LOAD_AUTOCOMPLETE: string, READ_STRING: string,
 *       READ_CHARACTER: string, AUTHORIZATION_STATUS: string, WATCH: string,
 *       LOGIN_INFO: string}}
 */
TerminalController.prototype.CLIENT_ACTION = {
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
TerminalController.prototype.SERVER_ACTION = {
    NONE: String.fromCharCode(0),
    EXECUTE: String.fromCharCode(1),
    EXECUTE_SQL: String.fromCharCode(2),
    GENERATE_AUTOCOMPLETE: String.fromCharCode(3),
    WATCH: String.fromCharCode(4),
    CHECK_WATCH: String.fromCharCode(5),
    RESET: String.fromCharCode(6),
    ECHO: String.fromCharCode(7)
};

/**
 * Fired when client authorized.
 */
TerminalController.prototype.authorized = function () {

    this._mode = this.MODE.EXECUTE;
    this.TERMINAL.output.printSync("Authorization successful.\r\n");

};

/**
 * Fired when namespace changes.
 *
 * @param {string} newNamespace
 */
TerminalController.prototype.namespaceChanged = function (newNamespace) {

    this.NAMESPACE = newNamespace;
    if (!this.TERMINAL.input.ENABLED) {
        this.TERMINAL.input.prompt(this.NAMESPACE + " > ");
    }

};

/**
 * This function handles any terminal query.
 *
 * @param {string} query
 */
TerminalController.prototype.terminalQuery = function (query) {

    if (query === "") {
        this.TERMINAL.input.prompt(this.NAMESPACE + " > ");
        return;
    }

    switch (this._mode) {

        case this.MODE.UNAUTHORIZED: {

        } break;

        case this.MODE.EXECUTE: {
            this.server.send(this.SERVER_ACTION.EXECUTE + query);
            this.TERMINAL.output.printSync("\r\n");
        } break;

    }

};

/**
 * Handles server data receive.
 *
 * @param {string} data
 */
TerminalController.prototype.serverData = function (data) {

    var action = data.charAt(0), // possible action
        body = data.substr(1);

    switch (this._mode) {

        case this.MODE.UNAUTHORIZED: {
            if (action === this.CLIENT_ACTION.AUTHORIZATION_STATUS) {
                if (body === "1") {
                    this.authorized();
                } else {
                    this.TERMINAL.output.printSync("Authorization failed.\r\n");
                }
            } else if (action === this.CLIENT_ACTION.LOGIN_INFO) {
                // do nothing
            } else {
                this.TERMINAL.output.printSync("Unable to authorise: server responses impolitely: "
                    + data + "\r\n");
            }
        } break;

        case this.MODE.EXECUTE: {
            if (action === this.CLIENT_ACTION.CHANGE_NAMESPACE) {
                this.namespaceChanged(body);
            } else if (action === this.CLIENT_ACTION.ENTER_CLEAR_IO) {
                this._mode = this.MODE.CLEAR_IO;
            }
        } break;

        case this.MODE.CLEAR_IO: {
            if (action === this.CLIENT_ACTION.EXIT_CLEAR_IO && body === "exit") {
                this._mode = this.MODE.EXECUTE;
                this.TERMINAL.output.printSync();
                this.TERMINAL.input.prompt(this.NAMESPACE + " > ");
            } else {
                this.TERMINAL.output.print(data);
            }
        } break;

        default: console.error("Data received in unsupported mode.");

    }

};