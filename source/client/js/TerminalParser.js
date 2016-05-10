/**
 * Implements functions for parsing content.
 *
 * @param {Terminal} TERMINAL
 * @constructor
 */
var TerminalParser = function (TERMINAL) {

    /**
     * @type {Terminal}
     */
    this.TERMINAL = TERMINAL;

    /**
     * This will generate CSS classes of type "syntax-{value}"
     *
     * @type {string[]}
     */
    this.THEMES = {
        "default": [
            "\x1B[38;5;226m", // internal command
            "\x1B[38;5;226m", // symbol
            "\x1B[38;5;76m", // string
            "\x1B[38;5;51m", // digit
            //"\x1B[38;5;39m", // className
            "\x1B[38;5;111m", // dollar functions/variables
            "\x1B[38;5;9m", // global
            "\x1B[38;5;180m", // number sign functions/variables
            "\x1B[38;5;51m", // method
            "\x1B[0m", // etc
            "\x1B[38;5;39m" // special: keyWord
        ],
        "cache": [
            "\x1B[38;5;166m", // internal command
            "\x1B[38;5;16m", // symbol
            "\x1B[38;5;28m", // string
            "\x1B[38;5;16m", // digit
            //"\x1B[38;5;31m", // className
            "\x1B[38;5;12m", // dollar functions/variables
            "\x1B[38;5;9m", // global
            "\x1B[38;5;20m", // number sign functions/variables
            "\x1B[38;5;12m", // method
            "\x1B[0m", // etc
            "\x1B[38;5;12m" // special: keyword
        ]
    };

    this._SPEC_ETC_POS = 8;
    this._SPEC_KEYWORD_POS = 9;

    //(%?[\\w\\.]+)|

    /**
     * Remembering parentheses here matching index in upper array.
     *
     * @type {RegExp}
     */
    this.SYNTAX_REGULAR_EXPRESSION = new RegExp("(\\/[a-z]+)|([\\[\\]\\{\\}\\(\\)\\-\\+\\*\\/_=])" +
        "|(\"[^\"]*\")|([0-9]\\.?[0-9]*)|(\\${1,3}[\\w]+)|(\\^[\\w]+)" +
        "|(#{2,3}[\\w]+)|(\\.{2}[\\w]+)|([\\w]+)", "g");

};

/**
 * Returns highlighted string.
 *
 * @param {string} string
 * @param {string} theme
 * @returns {string}
 */
TerminalParser.prototype.highlightSyntax = function (string, theme) {

    var _this = this;

    if (!_this.THEMES[theme]) theme = "default";

    return string.replace(this.SYNTAX_REGULAR_EXPRESSION, function(part) {

        var i;

        for (i = 1; i < arguments.length - 1; i++) {
            if (arguments[i]) {
                if (i - 1 === _this._SPEC_ETC_POS) {
                    if (_this.TERMINAL.dictionary.KEYWORDS
                        .hasOwnProperty(part)) {
                        return _this.THEMES[theme][_this._SPEC_KEYWORD_POS] + part + "\x1B[0m";
                    }
                }
                return _this.THEMES[theme][i - 1] + part + "\x1B[0m"
            }
        }

        return part;

    });

};
