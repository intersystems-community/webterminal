/**
 * Terminal controller instance handles input from terminal and converts data between server and
 * terminal application.
 *
 * The main messaging rules:
 *
 * Package body      Description                       Package body     Description
 * --<-- Server listens from client --<--              -->-- Client receives from server -->--
 * EXEC#{body}       Execute the {body}                AUTH#{s}         {s}==1 => client authorized
 *                                                     EST#             Execution started
 *                                                     END#             Execution ended
 *                                                     O#{data}         Output {data}
 *                                                     NS#{ns}          Change namespace to {ns}
 *                                                     R#{chars}        Read {chars} characters
 *                                                     PROMPT#{mess}    Ask user input with {mess}
 *                                                     I#{data}         Same as O
 *
 * @param {Terminal} TERMINAL
 * @constructor
 */
var TerminalController = function (TERMINAL) {

    /**
     * @type {Terminal}
     */
    this.TERMINAL = TERMINAL;

    /**
     * @type {boolean}
     */
    this.EXECUTION_IN_PROGRESS = false;

    /**
     * todo: remove debug parameter
     * @type {CacheWebTerminalServer}
     */
    this.server = new CacheWebTerminalServer(
        this, (location.protocol==="https:" ? "wss:" : "ws:"), location.host, "57772"
    );

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
    ENTER_CLEAR_IO: "EST", // enters clear IO. In this mode terminal won't send action id
    EXIT_CLEAR_IO: "END", // exits clear IO
    OUTPUT: "O", // just outputs message body
    CHANGE_NAMESPACE: "NS", // changes namespace
    LOAD_AUTOCOMPLETE: "AC", // loads autocomplete file. Body holds only namespace
    READ_STRING: "R", // reads string - removes namespace like in common terminal
    READ_CHARACTER: "RC", // reads character - removes namespace like in common terminal
    AUTHORIZATION_STATUS: "AUTH", // alerts client about authorization success. Holds 1/0
    WATCH: "WATCH", // start watching
    LOGIN_INFO: "I", // output information about login
    PROMPT: "PROMPT" // prompt user to input command
};

/**
 * Server action constants for client's first byte in message.
 *
 * @type {{NONE: string, EXECUTE: string, EXECUTE_SQL: string, GENERATE_AUTOCOMPLETE: string,
 *       WATCH: string, CHECK_WATCH: string, RESET: string, ECHO: string}}
 */
TerminalController.prototype.SERVER_ACTION = {
    EXECUTE: "EXEC#",
    EXECUTE_SQL: "SQL#",
    GENERATE_AUTOCOMPLETE: "GAC#",
    WATCH: "WATCH#",
    CHECK_WATCH: "CW#",
    RESET: "R#",
    ECHO: "E#"
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
TerminalController.prototype.setNamespace = function (newNamespace) {

    this.NAMESPACE = newNamespace;

};

/**
 * This function handles any terminal query.
 *
 * @param {string} query
 */
TerminalController.prototype.terminalQuery = function (query) {

    if (this.EXECUTION_IN_PROGRESS) {
        this.server.send(query);
    } else {
        this.server.send(this.SERVER_ACTION.EXECUTE + query);
        this.TERMINAL.output.printNewLine();
    }

};

/**
 * Defines handlers for server response.
 *
 * @type {{functions}}
 */
TerminalController.prototype.clientAction = {

    PROMPT: function (data) {
        this.TERMINAL.input.prompt(data + " > ");
    },

    EST: function () {
        this.EXECUTION_IN_PROGRESS = true;
    },

    END: function () {
        this.EXECUTION_IN_PROGRESS = false;
        this.TERMINAL.output.printNewLine();
    },

    /**
     * @param {string} data
     */
    O: function (data) {
        this.TERMINAL.output.print(data);
    },

    NS: function (data) {
        this.setNamespace(data);
    },

    AC: function () {
        // todo
    },

    R: function (length) {
        this.TERMINAL.input.prompt("", length);
    },

    RC: function () {
        // todo: without echo
        this.TERMINAL.input.prompt("", 1);
    },

    AUTH: function (data) {
        if (data === "1") {
            this.authorized();
        } else {
            this.TERMINAL.output.printSync("Authorization failed.\r\n");
        }
    },

    WATCH: function () {
        // todo
    },

    I: function (data) {
        this.TERMINAL.output.print(data + "\r\n");
    }

};

/**
 * Handles server data receive.
 *
 * @param {string} data
 */
TerminalController.prototype.serverData = function (data) {

    var action = data.split("#", 1)[0],
        body = data.substr(action.length + 1);

    if (this.clientAction.hasOwnProperty(action)) {
        this.clientAction[action].call(this, body);
    } else {
        this.TERMINAL.output.print(data);
        console.error("Server response unrecognised:", data);
    }

};