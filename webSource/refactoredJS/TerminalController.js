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
     * todo: remove debug parameter - port 57772
     * @type {CacheWebTerminalServer}
     */
    this.server = new CacheWebTerminalServer(
        this, (location.protocol === "https:" ? "wss:" : "ws:"), location.host, "57772"
    );

    /**
     * @type {CacheTracing}
     */
    this.trace = new CacheTracing(this);

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
 */
TerminalController.prototype.MODE = {
    UNAUTHORIZED: 0, // client not authorized, listening for CLIENT_ACTION.AUTHORIZATION_STATUS
    EXECUTE: 1, // executing commands on server
    CLEAR_IO: 2,// real-time execution (while messaging) mode until /END/ from server
    SQL: 3, // executing sql queries
    MACRO: 4 // macro recording (set of commands)
};

/**
 * Server action constants for client's first byte in message.
 */
TerminalController.prototype.SERVER_ACTION = {
    EXECUTE: "EXEC#",
    EXECUTE_SQL: "SQL#",
    AUTOCOMPLETE: "AC#",
    TRACE: "TRACE#",
    STOP_TRACE_ALL: "STOP_TRACE_ALL#",
    CHECK_TRACE: "CT#",
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
 * @param {string} namespace
 */
TerminalController.prototype.setNamespace = function (namespace) {

    this.TERMINAL.autocomplete.setNamespace(namespace);
    this.NAMESPACE = namespace;

};

/**
 * Internal terminal commands. Represented as a set of function with arguments. If function returns
 * false, user won't be prompted for input.
 */
TerminalController.prototype.internalCommands = {

    "help": function () {

        this.TERMINAL.output.print(this.TERMINAL.localization.get(49));

    },

    "autocomplete": function (args) {

        if (args[0] === "gen") {
            this.server.send(this.SERVER_ACTION.AUTOCOMPLETE);
        } else {
            this.mergeAutocompleteFile(this.NAMESPACE);
        }

        return false;

    },

    "echo": function (args) {

        this.server.send(this.SERVER_ACTION.ECHO + args.join("\r\n"));

        return false;

    },

    "trace": function (args) {

        if (args[0]) {
            this.server.send(this.SERVER_ACTION.TRACE + args[0]);
        } else {
            this.server.send(this.SERVER_ACTION.STOP_TRACE_ALL);
        }

        return false;

    },

    "sql": function () {

        this._mode = this._mode === this.MODE.SQL ? this.MODE.EXECUTE : this.MODE.SQL;

    },

    "reset": function () {

        this.TERMINAL.reset();

    },

    "favorite": function (args) {

        var _this = this,
            fav;

        if (!args.length) {
            this.TERMINAL.output.print("Usage:\r\n{your command} \x1B[1m/favorite\x1B[0m {name}" +
                "\x1B[35GTo save command.\r\n\x1B[1m/favorite\x1B[0m {name} \x1B[35GTo load " +
                "command.\r\nPreviously saved names: " +
                this.TERMINAL.favorites.getList().join(", ") + "\r\n");
        } else if (args[1]) {
            this.TERMINAL.favorites.set(args[1], args[0]);
        } else {
            fav = this.TERMINAL.favorites.get(args[0]);
            if (fav) {
                setTimeout(function () { _this.TERMINAL.input.set(fav); }, 1);
            } else {
                this.TERMINAL.output.print("No favorites saved for \"" + args[0] + "\".\r\n" +
                    "Previously saved: " + this.TERMINAL.favorites.getList().join(", ") + "\r\n");
            }
        }

    },

    "define": function (args) {

        if (args[0] && args[1] && args[0] !== "clear") {

            this.TERMINAL.definitions.define(args[1], args[0]);
            this.TERMINAL.output.print(args[0] + "\x1B[1m defined as\x1B[0m " + args[1]);

        } else if (args[0] === "clear") {

            this.TERMINAL.definitions.clear();
            this.TERMINAL.output.print("Definitions removed.");

        } else {

            this.TERMINAL.output.print("\x1B[4mUsage:\x1B[0m\r\n\x1B[1m/define\x1B[0m {everything}" +
                " {phrase}\x1B[35GTo define {phrase} as {everything}.\r\n\x1B[1m/define\x1B[0m " +
                "clear\x1B[35GClears all definitions.\r\n\x1B[4mExample:\x1B[0m "
                + "\x1B[2m##class(%Library.File).Exists( \x1B[0m\x1B[1m/define\x1B[0m \x1B[2m?f(\x1B[0m \r\n" +
                "This will set shorten expression for checking if file exists. Then, " +
                "commands like \x1B[2mw ?f(\"C:\")\x1B[0m will be automatically replaced with " +
                "\x1B[2mw ##class(%Library.File).Exists(\"C:\")\x1B[0m when submitting. " +
                "To clear definitions, give \"clear\" parameter.\r\n\x1B[4mList of definitions:\x1B[0m "
                + this.TERMINAL.definitions.getList().join(", "));

        }

    }

};

/**
 * Tries to execute command on client-side. If attempt was successful, returns true.
 *
 * @param {string} query
 * @return {boolean|number} - Returns false if query has no internal commands. Returns -1 if
 *                            user must not be prompted again.
 */
TerminalController.prototype.internalCommand = function (query) {

    var matched = query.match(/^\/([a-z]+)|\s\/([a-z]+)/),
        args = [], tempArgs = [],
        part, command;

    if (!matched) return false;

    if (command = matched[1]) { // command at beginning
        part = query.substr(matched[0].length);
    } else if (command = matched[2]) { // not at beginning
        args.push(query.substr(0, query.indexOf(matched[0]))); // argument before
        part = query.substr(query.indexOf(matched[0]) + matched[0].length); // other arguments
    }

    tempArgs = part.match(/"([^"]*)"|([^\s]*)/g);

    tempArgs.filter(function(a, b, c) {
        if (a.charAt(0) === "\"") {
            c[b] = a.substr(1, a.length - 2);
        }
        if (a) {
            args.push(c[b]);
        }
    });

    if (!this.internalCommands.hasOwnProperty(command)) {
        this.TERMINAL.output.print("Unknown internal command: /" + command + "\r\n");
        return true;
    }

    if (this.internalCommands[command].call(this, args) === false) {
        return -1;
    } else return true;

};

/**
 * This function handles any terminal query.
 *
 * @param {string} query
 */
TerminalController.prototype.terminalQuery = function (query) {

    var internal;

    if (this.EXECUTION_IN_PROGRESS) {

        this.server.send(query);

    } else {

        this.TERMINAL.output.print("\r\n");
        internal = this.internalCommand(query);

        if (internal === -1) {

            // do not prompt

        } else if (!internal) {

            if (this._mode === this.MODE.SQL) {
                this.server.send(this.SERVER_ACTION.EXECUTE_SQL + query);
            } else if (this._mode === this.MODE.EXECUTE) {
                this.server.send(this.SERVER_ACTION.EXECUTE + query);
            } else {
                console.warn("Unimplemented in mode " + this._mode + ": ", query);
            }

        } else {

            //this.TERMINAL.output.print("\r\n");
            this.clientAction["PROMPT"].call(this, this.NAMESPACE);

        }

    }

};

/**
 * Requests autocomplete file from server and merges it with autocomplete database.
 *
 * @param {string} namespace
 */
TerminalController.prototype.mergeAutocompleteFile = function (namespace) {

    var autocomplete = this.TERMINAL.autocomplete,
        _this = this,
        p, sp,
        i = 0;

    _this.TERMINAL.output.printSync("Merging autocomplete database for " + namespace +
        "...\r\n");

    this.server.getAutocompleteFile(namespace, function (data, namespace) {

        if (data) {

            if (data["class"]) {
                for (p in data["class"]) {
                    autocomplete.register(autocomplete.TYPES.class, p, namespace);
                    for (sp in data["class"][p]) {
                        autocomplete.register(autocomplete.TYPES.subclass, sp, namespace, [p]);
                    }
                    ++i;
                }
            }

            _this.TERMINAL.output.print("Classes merged: " + i + "\r\n");
            i = 0;

            if (data["global"]) {
                for (p in data["global"]) {
                    autocomplete.register(autocomplete.TYPES.globals, "^" + p, namespace);
                    ++i;
                }
            }

            _this.TERMINAL.output.print("Globals merged: " + i + "\r\n");

            _this.clientAction["PROMPT"].call(_this, _this.NAMESPACE);

        } else {

            _this.TERMINAL.output.print("No autocomplete file found on server. Requesting...\r\n");
            _this.server.send(_this.SERVER_ACTION.AUTOCOMPLETE);

        }

    });

};

/**
 * Defines handlers for server response.
 *
 * @type {{functions}}
 */
TerminalController.prototype.clientAction = {

    PROMPT: function (data) {
        this.setNamespace(data);
        this.TERMINAL.output.print("\r\n");
        this.TERMINAL.input.prompt(data + (this._mode === this.MODE.SQL ? ":SQL" : "") + " > ");
    },

    /**
     * todo: reorganize - hold from start till the end of server processing, not output.
     * @constructor
     */
    EST: function () {
        this.EXECUTION_IN_PROGRESS = true;
    },

    END: function () {
        this.EXECUTION_IN_PROGRESS = false;
    },

    /**
     * @param {string} data
     */
    O: function (data) {
        this.TERMINAL.output.print(data);
    },

    /**
     * @param {string} data
     */
    NS: function (data) {
        this.setNamespace(data);
    },

    AC: function (data) {

        this.mergeAutocompleteFile(data);

    },

    R: function (length) {
        this.TERMINAL.input.prompt("", length);
    },

    RC: function () {
        this.TERMINAL.input.prompt("", 1);
    },

    AUTH: function (data) {
        if (data === "1") {
            this.authorized();
        } else {
            this.TERMINAL.output.printSync("Authorization failed.\r\n");
        }
    },

    TRACE: function (data) {
        this.trace.start(data);
    },

    STOP_TRACE: function (data) {
        this.trace.stop(data);
    },

    I: function (data) {
        this.TERMINAL.output.print(data + "\r\n");
    },

    CLRSCR: function () {
        this.TERMINAL.output.clear();
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