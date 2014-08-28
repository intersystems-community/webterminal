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
    this.TYPES = [
        "\x1B[38;5;226m", // internal command
        "\x1B[38;5;226m", // symbol
        "\x1B[38;5;76m", // string
        "\x1B[38;5;51m", // digit
        "\x1B[38;5;39m", // className
        "\x1B[38;5;111m", // dollar functions/variables
        "\x1B[38;5;9m", // global
        "\x1B[38;5;180m", // number sign functions/variables
        "\x1B[38;5;51m", // method
        "\x1B[0m" // word
    ];

    /**
     * Remembering parentheses here matching index in upper array.
     *
     * @type {RegExp}
     */
    this.SYNTAX_REGULAR_EXPRESSION = new RegExp("(\\/[a-z]+)|([\\[\\]\\{\\}\\(\\)\\-\\+\\*\\/_=])" +
        "|(\"[^\"]*\")|([0-9]\\.?[0-9]*)|(%?[\\w\\.]+)|(\\${1,3}[\\w]+)|(\\^[\\w]+)" +
        "|(#{2,3}[\\w]+)|(\\.{2}[\\w]+)|([\\w]+)", "g");

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
