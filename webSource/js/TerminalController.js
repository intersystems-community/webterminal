/**
 * Terminal controller instance handles input from terminal and converts data between server and
 * terminal application.
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
     * @type {TerminalLocalization}
     * @private
     */
    this._lc = TERMINAL.localization;

    /**
     * @type {boolean}
     */
    this.EXECUTION_IN_PROGRESS = false;

    /**
     * @type {CacheWebTerminalServer}
     */
    this.server = new CacheWebTerminalServer(
        this, (location.protocol === "https:" ? "wss:" : "ws:"), location.hostname,
        ""/*build.replace:location.port*/ || "57776"
    );

    /**
     * @type {CacheTracing}
     */
    this.trace = new CacheTracing(this);

    this.autocompleteController = new CacheAutocompleteController(this);

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
 * Server action constants for client's message. This must be in a head of each WebSocket message.
 */
TerminalController.prototype.SERVER_ACTION = {
    EXECUTE: "EXEC#",
    EXECUTE_SQL: "SQL#",
    AUTOCOMPLETE: "AC#",
    TRACE: "TRACE#",
    STOP_TRACE_ALL: "STOP_TRACE_ALL#",
    CHECK_TRACE: "CT#",
    RESET: "R#",
    ECHO: "E#",
    CHECK_UPDATE: "CU#",
    UPDATE: "U#"
};

/**
 * Fired when client authorized.
 */
TerminalController.prototype.authorized = function () {

    this._mode = this.MODE.EXECUTE;
    this.TERMINAL.output.printSync(this._lc.get(10) + "\r\n");

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

        this.TERMINAL.output.print(this.TERMINAL.localization.get(1));

    },

    "autocomplete": function (args) {

        if (!this.TERMINAL.settings.AUTOCOMPLETE) {
            this.TERMINAL.output.print(this._lc.get(50) + "\r\n");
            return;
        }

//        if (args[0] === "gen") {
//            this.server.send(this.SERVER_ACTION.AUTOCOMPLETE);
//        } else {
//            this.mergeAutocompleteFile(this.NAMESPACE);
//        }
//
//        return false;

        this.server.send(this.SERVER_ACTION.AUTOCOMPLETE
            + (!this.autocompleteController.SYSTEM_CLASSES_LOADED
                || args[0] === "sys" ? "1" : "0"));

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

        return false;

    },

    "favorite": function (args) {

        var _this = this,
            fav;

        if (!args.length) {
            this.TERMINAL.output.print(
                this._lc.get(11, this.TERMINAL.favorites.getList().join(", "))+ "\r\n"
            );
        } else if (args[1]) {
            this.TERMINAL.favorites.set(args[1], args[0]);
        } else {
            fav = this.TERMINAL.favorites.get(args[0]);
            if (fav) {
                setTimeout(function () { _this.TERMINAL.input.set(fav); }, 1);
            } else {
                this.TERMINAL.output.print(
                    this._lc.get(
                        12, args[0], this.TERMINAL.favorites.getList().join(", ")
                    ) + "\r\n"
                );
            }
        }

    },

    "define": function (args) {

        if (args[0] && args[1] && args[0] !== "clear") {

            this.TERMINAL.definitions.define(args[1], args[0]);
            this.TERMINAL.output.print(this._lc.get(13, args[0], args[1]));

        } else if (args[0] === "clear") {

            this.TERMINAL.definitions.clear();
            this.TERMINAL.output.print(this._lc.get(14) + "\r\n");

        } else {

            this.TERMINAL.output.print(
                this._lc.get(15, this.TERMINAL.definitions.getList().join(", "))
            );

        }

    },

    "version": function () {

        this.TERMINAL.output.print(this.TERMINAL.VERSION + "\r\n");

    },

    "update": function () {

        this.TERMINAL.output.print(this._lc.get(16, this.TERMINAL.VERSION) + "\r\n");

        this.server.send(this.SERVER_ACTION.CHECK_UPDATE);

        return false;

    },

    "settings": function (args) {

        var _this = this,
            arg, name, value, option;

        if ((arg = args.join("")).match(/[a-z]=[a-z0-9]/)) {
            name = arg.substring(0, arg.indexOf("="));
            value = arg.substr(name.length + 1);
            option = ({
                "locale": function (value) {
                    if (_this.TERMINAL.localization.setLocale(value)) {
                        _this.TERMINAL.output.print(_this._lc.get(27, value) + "\r\n");
                    } else {
                        _this.TERMINAL.output.print(_this._lc.get(28, value) + "\r\n");
                    }
                },
                "theme": function (value) {
                    if (_this.TERMINAL.theme.setTheme(value)) {
                        _this.TERMINAL.output.print(_this._lc.get(41, value) + "\r\n");
                    } else {
                        _this.TERMINAL.output.print(_this._lc.get(42, value) + "\r\n");
                    }
                },
                "highlightInput": function (value) {
                    if (_this.TERMINAL.settings.setHighlightInput(value.toLowerCase() === "true")) {
                        _this.TERMINAL.output.print(_this._lc.get(44) + "\r\n");
                    } else {
                        _this.TERMINAL.output.print(_this._lc.get(45) + "\r\n");
                    }
                },
                "showProgressIndicator": function (value) {
                    if (_this.TERMINAL.settings.setShowProgressIndicator(
                            value.toLowerCase() === "true")) {
                        _this.TERMINAL.output.print(_this._lc.get(46) + "\r\n");
                    } else {
                        _this.TERMINAL.output.print(_this._lc.get(47) + "\r\n");
                    }
                },
                "autocomplete": function (value) {
                    if (_this.TERMINAL.settings.setAutocomplete(
                            value.toLowerCase() === "true")) {
                        _this.TERMINAL.output.print(_this._lc.get(48) + "\r\n");
                    } else {
                        _this.TERMINAL.input.clearAutocompleteVariants();
                        _this.TERMINAL.output.print(_this._lc.get(49) + "\r\n");
                    }
                }
            })[name];
            if (option) {
                option(value);
            } else {
                this.TERMINAL.output.print(this._lc.get(51, name) + "\r\n");
            }
        } else {
            this.TERMINAL.output.print(
                this._lc.get(26,
                    "locale", this.TERMINAL.localization.getLocale(),
                        this.TERMINAL.localization.getAvailableList().join(", "),
                    "theme", this.TERMINAL.theme.getCurrentTheme(),
                        this.TERMINAL.theme.getAvailableList().join(", "),
                    "highlightInput", this.TERMINAL.settings.HIGHLIGHT_INPUT,
                    "showProgressIndicator", this.TERMINAL.settings.SHOW_PROGRESS_INDICATOR,
                    "autocomplete", this.TERMINAL.settings.AUTOCOMPLETE
                ) + "\r\n"
            )
        }

    },

    "about": function () {

        var interval,
            phrase = this._lc.get(43),
            pos = 0,
            _this = this;

        var colorPrint = function () {
            if (pos < phrase.length) {
                _this.TERMINAL.output.print(phrase[pos]);
                pos++;
            } else {
                clearInterval(interval);
                _this.clientAction.PROMPT.call(_this, _this.NAMESPACE);
            }
        };

        interval = setInterval(colorPrint, 25);

        return false;

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
        args = [], tempArgs,
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
        return false;
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

    var _this = this;

    _this.TERMINAL.output.printSync(this._lc.get(18, namespace) + "\r\n");

    this.server.getAutocompleteFile(namespace, function (data, namespace) {

        if (data) {

            _this.autocompleteController.registerObject(namespace, data);
            _this.clientAction["PROMPT"].call(_this, _this.NAMESPACE);

        } else {

            _this.TERMINAL.output.print(_this._lc.get(21) + "\r\n");
            _this.clientAction["PROMPT"].call(_this, _this.NAMESPACE);

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

    OL: function (data) {
        this.TERMINAL.output.print(this._lc.get(data));
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

        var _this = this;

        this.TERMINAL.input.getChar(function (char) {
            _this.server.send(char);
        });

    },

    AUTH: function (data) {
        if (data === "1") {
            this.authorized();
        } else {
            this.TERMINAL.output.printSync(this._lc.get(22) + "\r\n");
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
    },

    PROMPT_UPDATE: function (data) {

        var _this = this,
            parts = data.split("#"),
            version = parts[1],
            releaseNumber = parseInt(parts[0]),
            comment = parts[2] || "";

        if (!version || !releaseNumber) {
            console.error("Unable to parse version data: ", data);
            return;
        }

        if (releaseNumber > this.TERMINAL.RELEASE_NUMBER) {
            this.TERMINAL.output.print(this._lc.get(23) + "\r\n");
            this.TERMINAL.input.prompt("", 1, function (string) {
                if (string === "" || string.toLowerCase() === "y") {
                    _this.TERMINAL.output.print(" " + _this._lc.get(24) + "\r\n");
                    if (comment) _this.TERMINAL.output.print("\r\n" + comment + "\r\n\r\n");
                    _this.server.send(_this.SERVER_ACTION.UPDATE + version);
                } else {
                    _this.clientAction["PROMPT"].call(_this, _this.NAMESPACE);
                }
            });
        } else {
            this.TERMINAL.output.print(this._lc.get(25) + "\r\n");
            this.clientAction["PROMPT"].call(this, this.NAMESPACE);
        }

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