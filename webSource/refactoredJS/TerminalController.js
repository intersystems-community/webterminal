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
     * todo: remove debug parameters
     * @type {CachéWebTerminalServer}
     */
    this.server = new CachéWebTerminalServer(this, location.host, "57772");

    this.initialize();

};

TerminalController.prototype.initialize = function () {



};

/**
 * This function handles any terminal query.
 *
 * @param {string} query
 * // todo: check dependencies
 */
TerminalController.prototype.terminalQuery = function (query) {

    this.server.send(this.TERMINAL.SERVER_ACTION.EXECUTE + query);
    this.TERMINAL.input.prompt("ASK me again! > ");

};

/**
 * Handles server data receive.
 *
 * @param {string} data
 */
TerminalController.prototype.serverData = function (data) {

    this.TERMINAL.output.printSync("Server responses: " + data + "\r\n");

};