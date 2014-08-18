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
    // ["symbol", "string", "className", "digit", "dollar", "global", "grid", "method", "word"];
    this.TYPES = ["\x1B[33m", "\x1B[32m", "\x1B[36m", "\x1B[36m", "\x1B[34m", "\x1B[31m",
        "\x1B[34m", "\x1B[34m", "\x1B[0m"];

    /**
     * Remembering parentheses here matching index in upper array.
     *
     * @type {RegExp}
     */
    this.SYNTAX_REGULAR_EXPRESSION = /([\[\]\{\}\(\)\-\+\*\/_=])|("[^"]*")|(%?[\w\.]+)|([0-9]\.?[0-9]*)|(\${1,3}[\w]+)|(\^[\w]+)|(#{2,3}[\w]+)|(\.{2}[\w]+)|([\w]+)/g;

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
