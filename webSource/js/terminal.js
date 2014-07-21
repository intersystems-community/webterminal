/**
 * Main controller object for application.
 *
 * @author ZitRo
 *
 * Required objects:
 *  server, parser, log, dom, hid, application
 *
 * Under unit test: unit.js
 *
 * Cache terminal protocol over-WebSocket description (CTWPv3):
 *
 *  AUTHORIZATION:
 *      First package from client includes ONLY authorization key in clear text form. If this key is invalid, server
 *      closes connection immediately. If server accepts key, main terminal session starts.
 *
 *  MESSAGING:
 *      Every client-server package (except clear I/O mode) includes one action-identifier byte. This byte tells what to
 *      perform on received side. The next table of action bytes are in use:
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
 *      In this mode terminal client will listen for data from server and output any data as it is, without any action
 *      identifiers. The same with terminal: any data sent to server won't include any identifiers.
 *
 */
var terminal = new function() {

    var receiveDataHandler = null; // Server data handler. If function returns false, terminal won't process data.

    /**
     * Current terminal mode. Mode determines it's behavior.
     *
     * @type {{number}}
     */
    this.modes = {
        NORMAL: 0, // executing commands on server
        CLEAR_IO: 3,// real-time execution (while messaging) mode until /END/ from server
        SQL: 1, // executing sql queries
        MACRO: 2, // macro recording (set of commands)
        DEFAULT: 0, // default terminal mode
        LAST: 0 // determines last switched mode (functional, do not change)
    };

    /**
     * Actions identifiers for client (browser).
     *
     * @type {{string}}
     */
    this.clientActions = {
        NONE: String.fromCharCode(0), // useless action
        ENTER_CLEAR_IO: String.fromCharCode(1),// enters clear IO. In this mode terminal won't send action id
        EXIT_CLEAR_IO: String.fromCharCode(2),// exits clear IO
        OUTPUT: String.fromCharCode(3), // just outputs message body
        CHANGE_NAMESPACE: String.fromCharCode(4), // changes namespace
        LOAD_AUTOCOMPLETE: String.fromCharCode(5), // loads autocomplete file. Body holds only namespace
        READ_STRING: String.fromCharCode(6), // reads string - removes namespace like in common terminal
        READ_CHARACTER: String.fromCharCode(7), // reads character - removes namespace like in common terminal
        AUTHORIZATION_STATUS: String.fromCharCode(8), // alerts client about authorization success. Holds 1/0
        WATCH: String.fromCharCode(9), // start watching
        LOGIN_INFO: String.fromCharCode(10)
    };

    /**
     * Action identifiers for server.
     *
     * @type {{string}}
     */
    this.serverActions = {
        NONE: String.fromCharCode(0),
        EXECUTE: String.fromCharCode(1),
        EXECUTE_SQL: String.fromCharCode(2),
        GENERATE_AUTOCOMPLETE: String.fromCharCode(3),
        WATCH: String.fromCharCode(4),
        CHECK_WATCH: String.fromCharCode(5),
        RESET: String.fromCharCode(6),
        ECHO: String.fromCharCode(7)
    };

    this.mode = this.modes.DEFAULT; // mode changes current terminal submit action, look and behavior
    this.ready = false;

    /**
     * Saves terminal state (history, autocomplete, etc.) to local storage.
     */
    this.saveState = function() {

        storage.set("history", terminal.history.export());
        storage.set("language", terminal.language.export());
        storage.set("favorites", terminal.favorites.export());
        storage.set("definitions", terminal.definitions.export());
        storage.set("settings", settings.export());
        storage.modifySave();
        terminal.output.write(lang.get(6))

    };

    /**
     * Loads saved terminal state from local storage, including history, autocomplete objects, ets.
     *
     * @returns {boolean}
     */
    this.loadState = function() {

        if (typeof storage.lastSave() === "undefined") {
            terminal.output.write(lang.get(7));
            return false;
        }

        settings.import(storage.get("settings"));
        terminal.history.import(storage.get("history"));
        terminal.language.import(storage.get("language"));
        var favs = storage.get("favorites");
        if (favs) terminal.favorites.import(favs);
        var defs = storage.get("definitions");
        if (defs) terminal.definitions.import(defs);
        if (!settings.get_cleanStartup()) terminal.output.write(lang.get(2));

        return true;

    };

    /**
     * Returns state to default. This will cause recoil all saved history, autocomplete to default and page reload.
     */
    this.resetState = function() {

        server.submit(terminal.serverActions.RESET);
        storage.clear();
        settings.reset();
        location.reload();

    };

    this.favorites = new function() {

        var commands = {};

        /**
         * Add new favorite record.
         *
         * @param index
         * @param query
         */
        this.add = function(index, query) {
            commands[index] = query + "";
        };

        /**
         * Returns favorite command.
         *
         * @param index
         * @returns {string}
         */
        this.get = function(index) {
            index = Math.max(0, Math.min(index, 9));
            return commands[index];
        };

        this.export = function() {
            return {
                "!export:favorites": true,
                commands: commands
            };
        };

        this.import = function(favoritesImportObject) {
            if (!(typeof favoritesImportObject === "object" &&
                favoritesImportObject.hasOwnProperty("!export:favorites")) &&
                favoritesImportObject.commands) {
                log.write("Wrong object to import as favorites import object: ", favoritesImportObject);
                return;
            }
            commands = favoritesImportObject.commands;
        };

    };

    var handlers = { // private handling

        globalKeyDown: function(event) {

            if (!terminal.input.focused() && !hid.keyPressed(hid.keys.CTRL)) {
                dom.objects.input.focus();
            }

            if (terminal.input.keyAction(event)) {
                setTimeout(function(){
                    terminal.input.keyPress.call(terminal.input,event.keyCode);
                },1);
            }

        },

        inputKeyDown: function() {
            terminal.input.update();
        },

        inputClick: function() {
            terminal.input.update();
        },

        /**
         * Executes when terminal application is closed.
         */
        end: function() {

            if (settings.get_restoreSession()) {
                terminal.output.write(lang.get(8));
                terminal.saveState();
            }
            server.disconnect();

        }

    };

    this.handlers = { // public handling

        serverMessage: function(data) {

            var result = (typeof receiveDataHandler == "function")?receiveDataHandler.call(this,data):1;
            if (result !== false) terminal.processor.processServerData(data);

        }

    };

    this.processor = new function() {

        var CREATE_OUTPUT = false; // output for empty server clear I/O message handler

        /**
         * Processes data received from server.
         *
         * @param data
         */
        this.processServerData = function(data) {

            var possibleAction = data.charAt(0);

            if (possibleAction == terminal.clientActions.EXIT_CLEAR_IO && data.substr(1) == "exit") {
                terminal.output.freeStack(0);
                terminal.output.setTarget(dom.objects.output);
                terminal.output.markDownAll();
                terminal.mode = terminal.modes.LAST;
                CREATE_OUTPUT = false;
            } // exit clear IO

            data = parser.clearHTML(data);

            if (CREATE_OUTPUT) { // wait for next message
                var obj = terminal.output.forceWrite("",true);
                terminal.output.setTarget(obj);
                CREATE_OUTPUT = false;
            }

            switch (terminal.mode) {
                case terminal.modes.NORMAL: terminal.processor.performAction(data.charAt(0),data.substr(1)); break;
                case terminal.modes.CLEAR_IO: {
                    if (possibleAction == terminal.clientActions.READ_STRING ||
                        possibleAction == terminal.clientActions.READ_CHARACTER) {
                        if (possibleAction == terminal.clientActions.READ_CHARACTER) terminal.input.switchCharRead();
                        terminal.namespace.set("");
                    }
                    terminal.processor.write((settings.get_parseOutput())?parser.highlightHTML(data):data, true);
                } break;
                case terminal.modes.SQL: {
                    if (possibleAction == terminal.clientActions.ENTER_CLEAR_IO) {
                        terminal.processor.performAction(possibleAction,data.substr(1))
                    } else if ((possibleAction == terminal.clientActions.EXIT_CLEAR_IO)) {
                        // upper
                    } else terminal.processor.write((settings.get_parseOutput())?parser.highlightHTML(data):data);
                } break;
                default: terminal.processor.write(lang.get(9) + " " + terminal.mode + ": " + lang.get(10) + ":\n" + data);
            }

        };

        /**
         * Performs action under data.
         *
         * @param action {string}
         * @param data {string}
         */
        this.performAction = function(action,data) {

            switch (action) {
                case terminal.clientActions.OUTPUT: terminal.output.write(parser.prepareForOutputHTML(data,-1,1)); break;
                case terminal.clientActions.CHANGE_NAMESPACE: terminal.namespace.set(data); break;
                case terminal.clientActions.ENTER_CLEAR_IO: {
                    terminal.modes.LAST = terminal.mode;
                    CREATE_OUTPUT = true;
                    terminal.mode = terminal.modes.CLEAR_IO;
                } break;
                case terminal.clientActions.EXIT_CLEAR_IO: terminal.mode = terminal.modes.LAST; break;
                case terminal.clientActions.LOAD_AUTOCOMPLETE: {
                    server.requestAutocompleteFile(data || terminal.namespace.getCorrectFileName());
                } break;
                case terminal.clientActions.AUTHORIZATION_STATUS: {
                    if (data.charAt(0) === "!") {
	                	terminal.output.write(data.substr(1))
                    } else if (!settings.get_cleanStartup()) {
                        terminal.output.write((data == "1")?lang.get(3):lang.get(5));
                    }
                    terminal.ready = true; // TERMINAL READY
                } break;
                case terminal.clientActions.WATCH: {
                    terminal.watches.watch(data.trim());
                } break;
                case terminal.clientActions.LOGIN_INFO: {
                    if (data.charAt(0) === "!") {
	                    terminal.output.write(lang.get(79) + " " + data.substr(1));
                    } else if (!settings.get_cleanStartup()) {
	                    terminal.output.write(lang.get(78) + " " + data);
                    }
                } break;
                default: {
                    log.write("Unrecognised action from server.");
                    terminal.output.write(data);
                }
            }

        };

        this.internal = {

            sql: function() {
                if (terminal.mode == terminal.modes.SQL){
                    terminal.namespace.update();
                    terminal.mode = terminal.modes.NORMAL;
                } else {
                    terminal.namespace.mask("SQL");
                    terminal.mode = terminal.modes.SQL;
                }
                terminal.output.write("<span class=\"info\">" + lang.get(11) + " " +
                    lang.get((terminal.mode == terminal.modes.SQL)?12:13) + "</span>");
            },

            help: function() {
                terminal.output.write(application.HELPBOX);
            },

            settings: function() {
                settings.openPanel();
            },

            autocomplete: function(regenerate) {
                server.submit(
                    terminal.serverActions.GENERATE_AUTOCOMPLETE,
                    ((regenerate==="new")?"1":"0"),
                    false
                );
            },
            
            version: function() {
	            terminal.output.write(application.version());
            },

            clear: function() {
                dom.clearLogs();
            },

            save: function() {
                terminal.saveState();
            },

            load: function() {
                terminal.loadState();
            },

            reset: function() {
                terminal.resetState();
            },

            connect: function(url) {
                server.connect(url);
                terminal.output.write(lang.get(15));
            },

            disconnect: function() {
                server.disconnect();
            },

            reconnect: function() {
                server.disconnect();
                server.connect();
            },

            define: function(redefinition, definition) {
                if (!definition || !redefinition) {
                    terminal.output.write(lang.get(16) + " /define [definition] [redefinition]");
                    return;
                }
                terminal.definitions.add(definition,redefinition);
                terminal.output.write("<span class=\"info\">" + definition + "</span> " + lang.get(17) + " " +
                    "<span class=\"info\">" + redefinition + "</span>")
            },

            about: function() {
                server.submit(terminal.serverActions.EXECUTE, 'for i=0:0.2:$zpi*2 { for u=1:1:($zsin(i)*15 + 15) { w ' +
                    '" " } w "# " if (i=1.4) { w "' + application.version() + '" } elseif (i=1.6) {' +
                    ' w "'+lang.get(18)+' InterSystems Cache" } elseif (i=1.8) { w "by ZitRo" } elseif (i=4.4) { w "' +
                    lang.get(19) + '" } elseif (i=4.6) { w "'+lang.get(20)+': http://intersystems-ru.github.io/webterm' +
                    'inal" } elseif (i=4.8) { w "'+lang.get(21)+'" } w ! h 0.04}');
            },

            siege: function(iterations,serverDelay) {
                if (typeof iterations == "undefined") { iterations = 120 }
                if (typeof serverDelay == "undefined") { serverDelay = 0.02 }
                var serverCommand = "for i=1:1:"+iterations+" {\n  set s = \"\"\n  write s,$CHAR(65+$RANDOM(26))\n" +
                    "  if ($RANDOM(5) = 0) { write \" \" }\n  h "+serverDelay+"\n}";

                terminal.input.set(serverCommand);
                terminal.input.submit();
                var startTime = new Date().getTime();
                var packages = 0;

                receiveDataHandler = function(data) {
                    packages++;
                    if (data.charAt(0) == terminal.clientActions.EXIT_CLEAR_IO) {
                        receiveDataHandler = null;
                        var timeDifference = new Date().getTime() - startTime;
                        terminal.output.freeStack(0);
                        terminal.output.write("<span class=\"info\"><br>"+lang.get(23)+": " +
                            timeDifference + "/" + (serverDelay*iterations*1000) + "ms ("+lang.get(25)+")" +
                            "<br>"+lang.get(24)+": "+packages+"</span>\n");
                    }
                    return true;
                }
            },

            tail: function(name) {
                if (!name) {
                    if (!terminal.watches.stopAll()) {
                        terminal.output.write(lang.get(26))
                    }
                    return;
                }
                server.submit(terminal.serverActions.WATCH, name);
            },

            favorite: function(code, slot) {
                if (!isNaN(code)) {
                    terminal.input.set(terminal.favorites.get(code));
                    terminal.input.moveCaretToEnd();
                    return;
                }
                if (!code) { terminal.output.write(lang.get(27)); return;}
                if (slot && slot > -1 && slot < 10) {
                    terminal.favorites.add(slot, code);
                    terminal.output.write(lang.get(28) + " " + slot + ".");
                } else terminal.output.write(lang.get(29))
            },

            watch: function(name) {
                terminal.processor.executeInternal("tail",[name]);
            },

            tip: function(flag) {
                terminal.output.write(application.getTips(!!(flag === "all")));
            },

            echo: function() {
                if (arguments.length == 0) {
                    arguments[0] = lang.get(30);
                    arguments.length = 1;
                }
                var s = "";
                for (var i = 0; i < arguments.length; i++) {
                    s += ((i !== 0)?"\n":"") + arguments[i];
                }
                server.submit(terminal.serverActions.ECHO, s);
            }

        };

        /**
         * Executes internal command with given arguments.
         *
         * @param command
         * @param args
         */
        this.executeInternal = function(command,args) {

            if (this.internal.hasOwnProperty(command)) {
                if (!args || !args[0]) args = [];
                this.internal[command].apply(this,args)
            } else terminal.output.write(lang.get(31) + ": " + command);

        };

        /**
         * Write data to output stack and. This stage will process any escape-sequences received from server.
         * TODO: process escape-sequences
         *
         * @param data {string}
         */
        this.write = function(data) {
	        
	        // @todo: split to process escape sequence method
	        //console.log(">" + data + "<");
	        if (data === String.fromCharCode(12)) { // clearing #
	        	//dom.clearLogs(); // partly wrong: check todo
	        	terminal.output.clear();
	        	//terminal.output.setTarget(dom.objects.output);
	        } else terminal.output.write(data);
        };

    };

    this.initialize = function() {

        if (!dom.initialize() || !settings.initialize()) {
            log.write("Unable to init terminal: dom fault.",dom.objects);
            return;
        }

        lang.initialize();
        storage.initialize();
        lang.setLanguage(settings.get_language());

        this.output.setTarget(dom.objects.output); // set standard output

        hid.bindKeyDown(document, handlers.globalKeyDown);
        hid.bindKeyDown(document, function(){ // 1ms wrapper: to get input value in handler without masturbation
            setTimeout(function(){handlers.inputKeyDown()},1);
        });
        hid.bindClick(dom.objects.input, handlers.inputClick);
        window.onbeforeunload = handlers.end;

        var serverURL = server.getDefaultServerURL();
        if (!settings.get_cleanStartup()) {
            this.output.write(lang.get(0));
            this.output.write(lang.get(1) + " " + serverURL + "...");
        }

        server.connect(serverURL);
        dom.remove(dom.objects.startupScript);

        this.input.clear(); // Clear histories caused by "back" page
        this.input.focus();
        this.input.update();

    };

    /**
     * Represents method to work with history
     */
    this.history = new function() {

        var history = [""], // history of all submitted commands. Starting with empty string
            current = 0; // current position in commandHistory

        /**
         * Gets history record by id.
         *
         * @param id
         * @returns {string}
         */
        this.getByID = function(id) {
            if (id < 0 || id > history.length - 1) return "";
            return history[id]
        };

        /**
         * Imports history from exported object.
         */
        this.import = function(historyObject) {
            if (!(historyObject && historyObject["!export:history"])) {
                log.write("Wrong history object to import.");
                return;
            }
            history = historyObject["history"];
            current = historyObject["current"];
            terminal.input.set(this.get());
        };

        /**
         * Extorts history to object.
         *
         * @returns {object}
         */
        this.export = function() {
            return {
                "!export:history": true,
                history: history,
                current: current
            }
        };

        /**
         * Saves text to current history.
         *
         * @param text
         */
        this.save = function(text) {
            history[current] = text;
        };

        /**
         * Creates new history record for current input.
         */
        this.add = function() {
            if (this.get() == "" || this.get() === this.getByID(current - 1)) return;
            current = history.length;
            history.push("");
        };

        /**
         * Seeks current history position to last.
         */
        this.moveToLast = function() {
            current = history.length - 1;
        };

        /**
         * Returns current history record.
         *
         * @returns {string}
         */
        this.get = function() {
            return history[current];
        };

        /**
         * Returns history record with increment. This method changes current work history field.
         *
         * @param increment
         * @returns {string}
         */
        this.load = function(increment) {

            current += increment || 0;
            if (current < 0) current = history.length-1;
            if (current >= history.length) current = 0;
            return history[current];

        }

    };

    this.autocompletion = new function() {

        var variants = {},
            current = 0,
            number = 0,
            part = "";

        // sorts variants in decreasing order
        this.sortVariants = function() {

            var sorted = {}, array = [];

            for (var key in variants) {
                if (!variants.hasOwnProperty(key)) continue;
                array.push(variants[key]);
            }

            array.sort(function(a, b){
                return (a === b)?0:(a.p > b.p)?-1:1;
            });

            for (var i = 0; i < array.length; i++) {
                sorted[array[i].part] = array[i];
            }

            variants = sorted;

        };

        /**
         * Gets updates autocompletion for given arguments. By default method will work with terminal input and will
         * update current autocomplete.
         *
         * Variant object: {
         *   <variant short name>: {
         *     full: <fullname>,
         *     origin: {
         *       <reference to original autocomplete object>
         *     },
         *     p: <sort order>
         *   }
         * }
         *
         * See parser->getAutocomplete.part for more details.
         *
         * [ @param position ]
         *  Position where to check.
         * [ @param string ]
         *  String to check.
         */
        this.reset = function(position,string) {
            if (typeof position == "undefined") position = terminal.input.caretPosition();
            if (typeof string == "undefined") string = terminal.input.get();
            var vars = parser.getAutocomplete(string,position);
            variants = vars.data;
            number = vars.length;
            this.sortVariants();
            part = this.get(current = 0);
            return part;
        };

        /**
         * Mark given variant value in tree. (most-used)
         */
        this.chooseCurrent = function() {

            var i = 0;
            for (var currentName in variants) {
                if (i === current) {
                    if (!variants.hasOwnProperty(currentName)) continue;
                    try {
                        if (typeof variants[currentName]["origin"][variants[currentName]["full"]] === "number") {
                            variants[currentName]["origin"][variants[currentName]["full"]]++; // by reference
                        } else {
                            if (!variants[currentName]["origin"][variants[currentName]["full"]].hasOwnProperty("!p"))
                                continue;
                            variants[currentName]["origin"][variants[currentName]["full"]]["!p"]++; // by reference
                        }
                    } catch (e) {
                        log.write("Can't mark current autocomplete: check given object.",variants[currentName]);
                    }
                    break;
                }
                i++;
            }

        };

        /**
         * Returns if some variants aviable.
         *
         * @returns {boolean}
         */
        this.hasVariants = function() {
            return number != 0;
        };

        /**
         * Returns next autocomplete variant.
         *
         * @returns {string}
         */
        this.next = function() {
            if (this.hasVariants()) {
                part = this.get(current+1);
                return part;
            } else {
                part = "";
                return part;
            }
        };

        /**
         * Returns previous autocomplete variant.
         *
         * @returns {string}
         */
        this.previous = function() {
            if (this.hasVariants()) {
                part = this.get(current-1);
                return part;
            } else {
                part = "";
                return part;
            }
        };

        /**
         * Get variant by it's index in current variants. Note that index can handle any integer
         *
         * @param index
         * @returns {string}
         */
        this.get = function(index) {

            if (index < 0) index += number
            index = index % number;

            var i = 0, name = "";
            for (var currentName in variants) {
                if (i === index) {
                    name = currentName;
                    break;
                }
                i++;
            }

            current = index;
            return name;

        };

        /**
         * Clears all variants.
         */
        this.clear = function() {
            variants = {};
            current = 0;
            number = 0;
            part = "";
        };

        /**
         * Show variant to the user.
         */
        this.getSuggestion = function() {
            if (this.hasVariants()) {
                return this.get(current);
            } else return "";
        };

    };

    this.definitions = new function() {

        var definitions = {
            // "#1": "##class(My.Class)"
        };

        this.add = function(definition,redefinition) {
            definitions[definition] = redefinition;
            terminal.language.tokens["definitions"][definition] = 0;
        };

        this.remove = function(definition) {
            if (definitions.hasOwnProperty(definition)) {
                delete definitions[definition];
            } else log.write(definition + " not defined and cannot be removed.")
        };

        /**
         * Replaces all definitions in string.
         *
         * @param string
         */
        this.replace = function(string) {
            for (var def in definitions) {
                if (!definitions.hasOwnProperty(def)) continue;
                string = string.replace(def,definitions[def]);
            }
            return string;
        };

        this.export = function() {
            return {
                "!export:definitions": true,
                definitions: definitions
            };
        };

        this.import = function(languageImportObject) {
            if (!(typeof languageImportObject === "object" &&
                languageImportObject.hasOwnProperty("!export:definitions")) &&
                languageImportObject.definitions) {
                log.write("Wrong object to import as definitions import object: ", languageImportObject);
                return;
            }
            definitions = languageImportObject.definitions;
        };

    };

    this.watches = new function() {

        var watches = {

            },
            intervalID = -1,
            interval = 1000,
            check = function() {
                if (terminal.mode === terminal.modes.CLEAR_IO ||
                    terminal.mode === terminal.modes.SQL) return;
                try {
                    server.submit(terminal.serverActions.CHECK_WATCH)
                } catch (e) {
                    clearInterval(intervalID);
                    intervalID = -1;
                    terminal.output.write(lang.get(32))
                }
            };

        this.getWatches = function() { return watches };

        /**
         * Server handler for watch start/stop.
         *
         * @param name
         */
        this.watch = function(name) {
            if (name.charAt(0) == "!") {
                terminal.output.write(lang.get(33) + " " + name.substr(1));
                return;
            }
            var type = (name.charAt(0) === "^")?"global":"file";
            if (watches.hasOwnProperty(name)) {
                for(var prop in watches) {
                    if (!watches.hasOwnProperty(prop)) continue;
                    var props = true; break;
                }
                if (props) {
                    clearInterval(intervalID);
                    intervalID = -1;
                }
                delete watches[name];
                terminal.output.write(lang.get(34) + " " + name);
            } else {
                watches[name] = {
                    type: type
                };
                if (intervalID === -1) intervalID = setInterval(check, interval);
                terminal.output.write(lang.get(35) + " " + name);
            }
        };

        /**
         * Stops all watches. Returns true if at least one watch had been stopped.
         *
         * @returns {boolean}
         */
        this.stopAll = function() {
            var stop;
            for (var watch in watches) {
                if (!watches.hasOwnProperty(watch)) continue;
                stop = true;
                this.watch(watch);
            }
            return stop;
        };

    };

    /**
     * Represents output and everything related to it.
     * todo: reorganise "animations" usage
     * todo: remove "highlight output" option
     */
    this.output = new function() {

        /**
         * Output stack. A string including everything related to output and used to update terminal
         * output once per ~25ms
         *
         * @type {string}
         */
        var stack = "",
            /**
             * @type {HTMLElement|null}
             * @deprecated - CWTv2: Terminal has only one output target.
             */
            target = null,
            /**
             * @type {number}
             * @deprecated
             */
            lastID = 0,
            /**
             * @type {boolean}
             * @deprecated - Rebase marking mechanism.
             */
            mark = false,
            _this = this,
            escapeCharactersProcessing = false;

        var STACK_REFRESH_INTERVAL = 25;

        /**
         * Writes text to output as standalone message. If oldOutput defined, write will be forced to old output object.
         * Optional processEscape parameter will turn on escape characters processing for current output. This option
         * will be automatically turned off in case of any call of forceWrite function (turning once for current stack).
         * Also escape characters processing are unavailable for forceWrite call. To process escape-characters, set
         * html-container as a field of output, then perform forceWrite once with empty body, and then use write with
         * processEscape flag.
         *
         * @param text {string}
         * @param {boolean} [processEscape]
         */
        this.write = function(text, processEscape) {
	        
            /*escapeCharactersProcessing = !!(processEscape);
            if (target == dom.objects.output) {
                this.forceWrite(text);
            } else {
                stack += text.replace('[0J','');
            }*/
            stack += text;

        };

        /**
         * Sets output target to object.
         *
         * @param object
         * @returns {boolean}
         * @deprecated - CWTv2: Terminal has only one output target.
         */
        this.setTarget = function(object) {
            target = object;
            return true;
        };
        
        /**
         * Clears output field.
         * @deprecated - CWTv2: use escape sequence instead.
         */
        this.clear = function() {
	        
	        // @todo: fix this potentially wrong code
	        dom.clearLogs();
	        stack = "";
	        
	        var t = document.createElement("DIV"); // @wrong
	        t.className = "terminal-message-body terminal-output-body"; // @absolute
	        dom.objects.output.appendChild(t); // @fix
	        target = t; // @todo: fix this
	        
        };

        /**
         * Marks down all marked log headers.
         */
        this.markDownAll = function() {
            if (mark == false) dom.performForClassObjects("waiting", function(object){
                object.className = object.className.replace(/waiting/g,"complete")
            });
        };

        /**
         * Writing output to object immediately.
         *
         * @param text
         * @param [marking] - Shows if it needed to mark log as "executing". Mark will still
         *                    continue until another force write call.
         * @return {object} - Object to output to.
         */
        this.forceWrite = function(text, marking) {

			/*if (typeof marking == "undefined") marking = false;
            escapeCharactersProcessing = false;

            var div = document.createElement("div");
            div.id = "terminal-log-"+lastID++;
            div.className = "terminal-outputContainer animated01";
            if (marking) {
                div.style.opacity = "0";
            }

            var head = document.createElement("div");
            head.className = "terminal-message-head"+((marking)?" waiting":"");
            head.innerHTML = terminal.namespace.getMask();

            var body = document.createElement("div");
            body.className = "terminal-message-body terminal-output-body";
            body.innerHTML = text;
 			
            div.appendChild(head);
            div.appendChild(body);
            target.appendChild(div);
            setTimeout(function(){div.style.opacity = "1";},1);

            dom.scrollBottom();

            return body;*/
            _this.freeStack();

        };

        this.freeStack = function(highlight) {

            /*if (!stack) return;

            if (settings.get_animations()) {
                var el = document.createElement("span");
                el.className = "animated01";
                el.innerHTML = (highlight)?parser.highlightHTML(stack):stack;
                el.style.opacity = "0";
                setTimeout(function(){ el.style.opacity = "1" }, 1);
                target.appendChild(el);
            } else {
                target.innerHTML += stack;
            }*/

            if (!stack) return;
            dom.objects.output.innerHTML += stack; // todo
            dom.scrollBottom();
            stack = "";

        };

        setInterval(this.freeStack,STACK_REFRESH_INTERVAL); // refreshing output

    };

    // represents input and anything related to it
    this.input = new function() {

        var readChar = false;

        /**
         * Updates main input field view, highlights and redraws area.
         */
        this.update = function() {
            var data = terminal.input.get();
            var cp = (this.focused())?terminal.input.caretPosition():-1;
            dom.objects.inputView.innerHTML =
                parser.prepareForOutputHTML(data,cp,1,1);
            dom.scrollBottom();
        };

        /**
         * Returns true while input element in dom under focus.
         *
         * @returns {boolean}
         */
        this.focused = function() {
            return (document.activeElement == dom.objects.input);
        };

        /**
         * Sets the caret position to position.
         *
         * @param position {number}
         */
        this.setCaretPosition = function(position) {
            var element = dom.objects.input;
            if(element.createTextRange) {
                var range = element.createTextRange();
                range.move("character", position);
                range.select();
            } else {
                if(element.selectionStart) {
                    element.focus();
                    element.setSelectionRange(position, position);
                } else {
                    element.focus();
                }
            }
        };

        /**
         * Places caret at end of input.
         */
        this.moveCaretToEnd = function() {
            this.setCaretPosition(this.get().length)
        };

        /**
         * Inserts string to position without problems with caret position.
         *
         * @param position {number}
         * @param string {string}
         */
        this.insert = function(position, string) {

            var insert = function(position, to, string) {
                    return to.splice(position,0,string);
                },
                seek = 0;

            if (this.focused()) {
                var p = this.caretPosition();
                seek = (position <= p)?string.length:0;
                this.set(insert(position,this.get(),string));
                this.setCaretPosition(p+seek);
            } else this.set(insert(position,this.get(),string));

            this.update();

        };

        /**
         * Returns input value.
         *
         * @returns {string}
         */
        this.get = function() {
            return dom.objects.input.value;
        };

        /**
         * Clears input.
         */
        this.clear = function() {
            dom.objects.input.value = "";
            this.update();
        };

        /**
         * Returns current caret position
         *
         * @returns {number}
         */
        this.caretPosition = function() {
            return dom.objects.getCaretPosition(dom.objects.input);
        };

        /**
         * Clears input and causes it to read one character instead of anything else.
         */
        this.switchCharRead = function() {
            this.clear();
            readChar = true;
        };

        /**
         * Focuses on input field.
         */
        this.focus = function() {
            dom.objects.input.focus();
        };

        /**
         * Returns line where caret placed.
         *
         * @returns {number}
         */
        this.caretLine = function() {
            var caretPos = this.caretPosition();
            var data = this.get();
            var np = data.indexOf("\n");
            var line = 1;
            while (np != -1) {
                if (caretPos <= np) break;
                line++;
                np = data.indexOf("\n",np+1);
            }
            return line;
        };

        /**
         * Returns number of lines in input.
         *
         * @returns {number}
         */
        this.lines = function() {
            var arr = this.get().match(/\n/g);
            if (!arr) return 1;
            return arr.length + 1;
        };

        /**
         * Searches for client-side command in string and tries to execute it.
         *
         * @param query
         * @returns {boolean}
         */
        var tryClientCommand = function(query) {
            var arr = query.match(/("[^"]*")|[^\s"]+/g);
            if (!arr) return false;
            for (var i = 0; i < arr.length; i++) {
                if (/^\/[a-z]+$/.test(arr[i])) {
                    var command = arr[i].substr(1);
                    arr.splice(0, i + 1);
                    var fish = query.substring(0,query.indexOf("/" + command) - 1); // mm, fish
                    for (var u = 0; u < arr.length; u++) {
                        arr[u] = arr[u].replace(/"/g,"");
                    }
                    if (fish !== "") arr.splice(0, 0, fish);
                    terminal.processor.executeInternal(command, arr);
                    return true;
                }
            }
            return false;
        };

        /**
         * Submits current input data with, maybe, another action.
         *
         * [ @param action ]
         */
        this.submit = function(action) {

            if (typeof action == "undefined" || !action) {
                action = terminal.serverActions.EXECUTE;
                switch (terminal.mode) {
                    case terminal.modes.NORMAL: action = terminal.serverActions.EXECUTE; break;
                    case terminal.modes.SQL: action = terminal.serverActions.EXECUTE_SQL; break;
                    case terminal.modes.CLEAR_IO: action = ""; break;
                }
            }

            var data = terminal.input.get();

            if (action == terminal.serverActions.EXECUTE) {
                terminal.language.parseForTokens(data);
            }

            terminal.history.moveToLast();
            terminal.history.save(data);
            terminal.history.add();
            terminal.input.clear();

            if (!tryClientCommand(data)) {

                data = terminal.definitions.replace(data);
                server.submit(action,data);
                terminal.output.write(parser.prepareForOutputHTML(data));

            }

            terminal.autocompletion.clear();
            if (terminal.mode != terminal.modes.SQL) terminal.namespace.update();

        };

        /**
         * Sets the input value.
         *
         * @param value
         */
        this.set = function(value) {
            dom.objects.input.value = value;
        };

        /**
         * This function handles keypress moment. Returns false if keyAction was blocked or handled. False will not
         * call keyPress event.
         *
         * @param event
         */
        this.keyAction = function(event) {

            var key = event.keyCode || 0;

            if (readChar) {
                readChar = false;
                server.submit("",String.fromCharCode(key),true);
                terminal.output.write(String.fromCharCode(key));
                hid.preventDefault(event);
                this.clear();
                return false;
            }

            if (key == hid.keys.ENTER && !(hid.keyPressed(hid.keys.SHIFT) || hid.keyPressed(hid.keys.CTRL))) {
                hid.preventDefault(event);
                setTimeout(this.submit,1);
                return false;
            }

            if (key == hid.keys.ESC) {
                settings.closePanel();
            }

            if (key == hid.keys.UP || key == hid.keys.DOWN) {
                var line = this.caretLine();
                if ((key == hid.keys.UP && line == 1) ||
                    (key == hid.keys.DOWN && (line + ((key == hid.keys.DOWN)?1:0))) == this.lines() + 1) {
                    this.set(terminal.history.load( (key == hid.keys.UP)?-1:1 ));
                    hid.preventDefault(event);
                    terminal.input.moveCaretToEnd();
                    return false;
                }
            }

            if (key == hid.keys.TAB) {
                var variant = terminal.autocompletion.getSuggestion();
                if (variant) {
                    terminal.autocompletion.chooseCurrent();
                    terminal.autocompletion.clear();
                    this.insert(this.caretPosition(),variant);
                } else {
                    this.insert(this.caretPosition(),"\t");
                }
                hid.preventDefault(event);
                return false;
            }

            if (key == hid.keys.ALT) {
                hid.preventDefault(event);
                return true;
            }

            return true;

        };

        /**
         * This function handles post-keypress moment, when input text had been updated.
         *
         * @param key {number}
         */
        this.keyPress = function(key) {

            if (!hid.functional(key) || key == hid.keys.BACKSPACE) {
                terminal.autocompletion.reset();
            }

            if (terminal.autocompletion.hasVariants()) {
                if (key == hid.keys.CTRL) {
                    terminal.autocompletion.next();
                } else if (key == hid.keys.ALT) {
                    terminal.autocompletion.previous();
                }
            }

        }

    };

    this.namespace = new function() {

        var namespace = lang.get(4),
            oldNamespace = namespace;

        /**
         * Set current namespace. Namespace won't change if something unless string will be passed.
         */
        this.set = function(string) {
            if (!string){
                dom.objects.namespace.style.visibility = "hidden";
            } else {
                namespace = (typeof string == "string")?string:namespace;
                dom.objects.namespace.style.visibility = "visible";
            }
            dom.objects.namespace.innerHTML = namespace;
            oldNamespace = namespace;
        };

        /**
         * Creates a mask for terminal namespace. It's just for a view - namespace.get() will return normal namespace.
         *
         * @param string
         */
        this.mask = function(string) {
            namespace = string;
            dom.objects.namespace.innerHTML = namespace;
        };

        /**
         * Get current real namespace
         *
         * @returns {string}
         */
        this.get = function() {
            return oldNamespace; // not masked namespace
        };

        /**
         * Get current visible namespace.
         *
         * @returns {string}
         */
        this.getMask = function() {
            return namespace;
        };

        /**
         * Returns server correct namespace for filenames.
         *
         * @returns {string}
         */
        this.getCorrectFileName = function() {
            return this.get().replace("%","_");
        };

        /**
         * Sets namespace to current.
         */
        this.update = function() {
            namespace = oldNamespace;
            this.set(namespace);
        }

    };

    /**
     * Terminal language object. This one used in autocomplete.
     *
     * Object consists of other objects which determines program language. That's no meter how to call first-level
     * objects of [tokens] - that's just for perception. Language units must have properties of type number, which
     * determines importance of language unit usage. Properties beginning with the symbol "!" are the control
     * properties. They determining extra rules for language unit. Functionality of this properties is the next:
     *  "!autocomplete": reversed regular expression for autocomplete. Note the follow:
     *      -   To search unit in any position join ".*" to the end of expression. There's no meter to add this if you
     *          expecting unit to be placed at the beginning of string, such as system commands.
     *      -   Insert brackets to regular expression in position which have to match with properties (language units)
     *      -   Do not forget to write REVERSED regular expression for your expectations.
     */
    this.language = new function() {

        /**
         * Inserts new class definition.
         *
         * @param name
         * @param classToken
         */
        this.addClass = function(name,classToken) { // adds class to tokens

            if (typeof classToken == "object") {

                var merging = !this.tokens.class.hasOwnProperty(name);

                if (merging) {
                    this.tokens.class[name] = classToken;
                } else {
                    this.tokens.class[name].merge(classToken);
                }

            } else {

                log.write("Trying to add incorrect class to terminal language classes: ",classToken);

            }

        };

        /**
         * Inserts new global definition.
         *
         * @param name
         * @param globalToken
         */
        this.addGlobal = function(name,globalToken) { // adds class to tokens

            if (typeof name === "string") {

                if (!this.tokens.global.hasOwnProperty(name)) {
                    this.tokens.global[name] = globalToken;
                } else {
                    this.tokens.global[name].merge(globalToken);
                }

            } else {

                log.write("Trying to add incorrect global to terminal language classes: ", globalToken);

            }

        };

        /**
         * Add a set of classes placed in classTokens objects
         *
         * @param classTokens
         */
        this.addClasses = function(classTokens) {

            if (typeof classTokens != "object") {
                log.write("language.addClasses error: argument is not an object.")
            }
            for (var property in classTokens) {
                if (!classTokens.hasOwnProperty(property)) continue;
                this.addClass(property,classTokens[property]);
            }

        };

        /**
         * Add a set of globals in globalTokens objects
         *
         * @param globalsTokens
         */
        this.addGlobals = function(globalsTokens) {

            if (typeof globalsTokens != "object") {
                log.write("language.addGlobals error: argument is not an object.")
            }
            for (var property in globalsTokens) {
                if (!globalsTokens.hasOwnProperty(property)) continue;
                this.addGlobal(property,globalsTokens[property]);
            }

        };

        this.export = function() {
            return {
                "!export:language": true,
                tokens: this.tokens
            };
        };

        this.import = function(languageImportObject) {
            if (!(typeof languageImportObject === "object" &&
                languageImportObject.hasOwnProperty("!export:language")) &&
                languageImportObject.tokens) {
                log.write("Wrong object to import as language import object: ", languageImportObject);
                return;
            }
            this.tokens = languageImportObject.tokens;
        };

        /**
         * Creates user's language token for name.
         *
         * @param name
         */
        this.joinUserToken = function(name) {
            var r = new RegExp("[a-zA-Z][a-zA-Z0-9]*");
            if (!r.test(name)) {
                log.write("Wrong user token " + name);
                return;
            }
            if (!this.tokens.user.hasOwnProperty(name)) {
                this.tokens.user[name] = 0
            }
        };

        /**
         * Creates user's language token for name.
         *
         * @param name
         */
        this.removeUserToken = function(name) {
            if (name === "*") {
                for (var t in this.tokens.user) {
                    if (!this.tokens.user.hasOwnProperty(t) || t.charAt(0) === "!") continue;
                    delete this.tokens.user[t];
                }
                return;
            }
            var r = new RegExp("[a-zA-Z][a-zA-Z0-9]*");
            if (!r.test(name)) {
                log.write("Wrong user token " + name);
                return;
            }
            if (this.tokens.user.hasOwnProperty(name)) {
                delete this.tokens.user[name]
            }
        };

        /**
         * Finds in string required tokens and adds/removes it to/from Cache language.
         * E.g. "set test = 12" or "s test = 12" will add "test" to tokens.user, and
         * "kill test" or "k test" will remove "test" token.
         *
         * @param string
         */
        this.parseForTokens = function(string) {

            string = " " + string + "  "; // keep two spaces
            var re = new RegExp("[\\s\\{](set|s)\\s(([a-zA-Z][a-zA-Z0-9]*)|(\\^[a-zA-Z][a-z\\.A-Z0-9]*))\\s*=","ig"),
                result = re.exec(string);
            if (result && result[2]) {
                if (result[2].charAt(0) === "^") {
                    this.tokens.global[result[2].substr(1)] = 0;
                } else {
                    this.joinUserToken(result[2]);
                }
            }

            re = new RegExp("[\\s\\{](k|kill)\\s(([a-zA-Z][a-zA-Z0-9]*)|(\\^[a-zA-Z][a-z\\.A-Z0-9]*))[\\s\\}]","ig");
            result = re.exec(string);
            if (result && result[2]) {
                if (result[2].charAt(0) === "^" && this.tokens.global.hasOwnProperty(result[2].substr(1))) {
                    delete this.tokens.global[result[2].substr(1)];
                } else this.removeUserToken(result[2]);
            }

            re = new RegExp("[\\s\\{](k|kill)[\\s]+?[^a-zA-Z]","ig");
            result = re.exec(string);
            if (result && result[1]) {
                this.removeUserToken("*");
            }

        };

        /**
         * Tokens language object. RULES:
         *  Autocomplete parsing will be performed for any object in {tokens} which has "!autocomplete" property and
         *  reversedRegExp property inside. There are two optional parameters:
         *      separator (no default) - brakes autocomplete variants by parts. For example, it can be point symbol "."
         *      caseSensitive (true) - makes variants case-sensitive. Make sure that non-sensitive variants defined as
         *          lowercase.
         *      child (no default) - parse autocomplete for child. In this case properties of current object have to be
         *          objects with the same structure as parent. {child} also can have reversedRegExp, which will stand as
         *          a postfix for parent regular expression.
         *
         *  reversedRegExp MUST have at least one pair of remembering parentheses - this where parser will search
         *  matches.
         */
        this.tokens = {

            "user": {
                "!autocomplete": {
                    reversedRegExp: "([a-zA-Z]+)\\s"
                }
            },
            "definitions": {
                "!autocomplete": {
                    reversedRegExp: "([^\\s]+)\\s.*"
                }
            },
            "client": {
                "!autocomplete": {
                    reversedRegExp: "([a-z]*/)+"
                },
                "/help": 1,
                "/clear": 0,
                "/connect": 0,
                "/disconnect": 0,
                "/reset": 0,
                "/reconnect": 0,
                "/autocomplete": 0,
                "/version": 0,
                "/save": 0,
                "/load": 0,
                "/settings": 0,
                "/siege": 0,
                "/define": 0,
                "/tail": 0,
                "/favorite": 0,
                "/watch": 0,
                "/tip": 1,
                "/echo": 0,
                "/about": 0
            },
            "commands": {
                "!autocomplete": {
                    reversedRegExp: "([a-zA-Z]+)\\s.*",
                    caseSensitive: false
                },
                "break": 0,
                "catch": 0,
                "close": 0,
                "continue": 0,
                "do": 0,
                "d": 0,
                "else": 0,
                "elseif": 0,
                "for": 0,
                "goto": 0,
                "halt": 0,
                "hang": 0,
                "h": 0,
                "if": 0,
                "job": 0,
                "j": 0,
                "kill": 0,
                "k": 0,
                "lock": 0,
                "l": 0,
                "merge": 0,
                "new": 0,
                "open": 0,
                "quit": 0,
                "q": 0,
                "read": 0,
                "r": 0,
                "return": 0,
                "set": 0,
                "s": 0,
                "tcommit": 0,
                "throw": 0,
                "trollback": 0,
                "try": 0,
                "tstart": 0,
                "use": 0,
                "view": 0,
                "while": 0,
                "write": 0,
                "w": 0,
                "xecute": 0,
                "x": 0,
                "zkill": 0,
                "znspace": 0,
                "zn": 0,
                "ztrap": 0,
                "zwrite": 0,
                "zw": 0,
                "zzdump": 0,
                "zzwrite": 0,

                "print": 0,
                "zbreak": 0,
                "zinsert": 0,
                "zload": 0,
                "zprint": 0,
                "zremove": 0,
                "zsave": 0,
                "zzprint": 0,

                "mv": 0,
                "mvcall": 0,
                "mvcrt": 0,
                "mvdim": 0,
                "mvprint": 0,
                "zquit": 0,
                "zsync": 0
            },
            "functions": {
                "!autocomplete": {
                    reversedRegExp: "([a-zA-Z]+)\\$\\s.*",
                    caseSensitive: false
                },
                "ascii": 0,
                "bit": 0,
                "bitcount": 0,
                "bitfind": 0,
                "bitlogic": 0,
                "case": 0,
                "char": 0,
                "classmethod": 0,
                "classname": 0,
                "compile": 0,
                "data": 0,
                "decimal": 0,
                "double": 0,
                "extract": 0,
                "factor": 0,
                "find": 0,
                "fnumber": 0,
                "get": 0,
                "increment": 0,
                "inumber": 0,
                "isobject": 0,
                "isvaliddouble": 0,
                "isvalidnum": 0,
                "justify": 0,
                "length": 0,
                "list": 0,
                "listbuild": 0,
                "listdata": 0,
                "listfind": 0,
                "listfromstring": 0,
                "listget": 0,
                "listlength": 0,
                "listnext": 0,
                "listsame": 0,
                "listtostring": 0,
                "listvalid": 0,
                "locate": 0,
                "match": 0,
                "method": 0,
                "name": 0,
                "nconvert": 0,
                "next": 0,
                "normalize": 0,
                "now": 0,
                "number": 0,
                "order": 0,
                "parameter": 0,
                "piece": 0,
                "prefetchoff": 0,
                "prefetchon": 0,
                "property": 0,
                "qlength": 0,
                "qsubscript": 0,
                "query": 0,
                "random": 0,
                "replace": 0,
                "reverse": 0,
                "sconvert": 0,
                "select": 0,
                "sortbegin": 0,
                "sortend": 0,
                "stack": 0,
                "text": 0,
                "translate": 0,
                "view": 0,
                "wascii": 0,
                "wchar": 0,
                "wextract": 0,
                "wfind": 0,
                "wiswide": 0,
                "wlength": 0,
                "wreverse": 0,
                "xecute": 0,

                "zabs": 0,
                "zarccos": 0,
                "zarcsin": 0,
                "zarctan": 0,
                "zcos": 0,
                "zcot": 0,
                "zcsc": 0,
                "zdate": 0,
                "zdateh": 0,
                "zdatetime": 0,
                "zdatetimeh": 0,
                "zexp": 0,
                "zhex": 0,
                "zln": 0,
                "zlog": 0,
                "zpower": 0,
                "zsec": 0,
                "zsin": 0,
                "zsqr": 0,
                "ztan": 0,
                "ztime": 0,
                "ztimeh": 0,

                "zboolean": 0,
                "zconvert": 0,
                "zcrc": 0,
                "zcyc": 0,
                "zdascii": 0,
                "zdchar": 0,
                "zf": 0,
                "ziswide": 0,
                "zlascii": 0,
                "zlchar": 0,
                "zname": 0,
                "zposition": 0,
                "zqascii": 0,
                "zqchar": 0,
                "zsearch": 0,
                "zseek": 0,
                "zstrip": 0,
                "zwascii": 0,
                "zwchar": 0,
                "zwidth": 0,
                "zwpack": 0,
                "zwbpack": 0,
                "zwunpack": 0,
                "zwbunpack": 0,
                "zzenkaku": 0,

                "change": 0,
                "mv": 0,
                "mvat": 0,
                "mvfmt": 0,
                "mvfmts": 0,
                "mviconv": 0,
                "mviconvs": 0,
                "mvinmat": 0,
                "mvlover": 0,
                "mvoconv": 0,
                "mvoconvs": 0,
                "mvraise": 0,
                "mvtrans": 0,
                "mvv": 0,
                "mvname": 0,

                "zbitand": 0,
                "zbitcount": 0,
                "zbitfind": 0,
                "zbitget": 0,
                "zbitlen": 0,
                "zbitnot": 0,
                "zbitor": 0,
                "zbitset": 0,
                "zbitstr": 0,
                "zbitxor": 0,
                "zincrement": 0,
                "znext": 0,
                "zorder": 0,
                "zprevious": 0,
                "zsort": 0
            },
            "variables": {
                "!autocomplete": {
                    reversedRegExp: "([a-zA-Z]+)\\$\\s.*",
                    caseSensitive: false
                },
                "device": 0,
                "ecode": 0,
                "estack": 0,
                "etrap": 0,
                "halt": 0,
                "horolog": 0,
                "io": 0,
                "job": 0,
                "key": 0,
                "namespace": 0,
                "principal": 0,
                "quit": 0,
                "roles": 0,
                "stack": 0,
                "storage": 0,
                "system": 0,
                "test": 0,
                "this": 0,
                "tlevel": 0,
                "username": 0,
                "x": 0,
                "y": 0,
                "za": 0,
                "zb": 0,
                "zchild": 0,
                "zeof": 0,
                "zeos": 0,
                "zerror": 0,
                "zhorolog": 0,
                "zio": 0,
                "zjob": 0,
                "zmode": 0,
                "zname": 0,
                "znspace": 0,
                "zorder": 0,
                "zparent": 0,
                "zpi": 0,
                "zpos": 0,
                "zreference": 0,
                "zstorage": 0,
                "ztimestamp": 0,
                "ztimezone": 0,
                "ztrap": 0,
                "zversion": 0
            },
            "staticMethod": {
                "!autocomplete": {
                    reversedRegExp: "([a-zA-Z]*##)\\s.*"
                },
                "##class": 0
            },
            "class": {
                "!autocomplete": {
                    reversedRegExp: "(([a-zA-Z\\.]*[a-zA-Z])?%?)\\(ssalc##\\s.*",

                    separator: ".",
                    child: {
                        reversedRegExp: "([a-zA-Z]*%?)\\.\\)"
                    }
                }
            },
            "global": {
                "!autocomplete": {
                    reversedRegExp: "(([a-zA-Z0-9\\.]*[a-zA-Z]+)?%?)\\^.*",
                    separator: "."
                }
            }
        }; // tokens

    };

};