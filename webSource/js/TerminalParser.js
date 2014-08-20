/**
 * Implements functions for parsing content.
 *
 * @constructor
 */
var TerminalParser = function () {

    /**
     * This will generate CSS classes of type "syntax-{value}"
     *
     * @type {string[]}
     */
    // ["symbol", "string", "digit", "className", "dollar", "global", "grid", "method", "word"];
    this.TYPES = ["\x1B[38;5;226m", "\x1B[38;5;76m", "\x1B[38;5;51m", "\x1B[38;5;39m",
        "\x1B[38;5;111m", "\x1B[38;5;9m", "\x1B[38;5;180m", "\x1B[38;5;51m", "\x1B[0m"];

    /**
     * Remembering parentheses here matching index in upper array.
     *
     * @type {RegExp}
     */
    this.SYNTAX_REGULAR_EXPRESSION = /([\[\]\{\}\(\)\-\+\*\/_=])|("[^"]*")|([0-9]\.?[0-9]*)|(%?[\w\.]+)|(\${1,3}[\w]+)|(\^[\w]+)|(#{2,3}[\w]+)|(\.{2}[\w]+)|([\w]+)/g;

};

/**
 * Returns highlighted string.
 *
 * @param {string} string
 * @returns {string}
 */
TerminalParser.prototype.highlightSyntax = function (string) {

    var _this = this;

    return string.replace(this.SYNTAX_REGULAR_EXPRESSION, function(part) {

        var i;

        for (i = 1; i < arguments.length - 1; i++) {
            if (arguments[i]) {
                return _this.TYPES[i - 1] + part + "\x1B[0m"
            }
        }

        return part;

    });

};
