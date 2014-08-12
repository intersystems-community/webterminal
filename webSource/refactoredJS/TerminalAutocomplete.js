/**
 * Autocomplete mechanism of terminal.
 *
 * @constructor
 */
var TerminalAutocomplete = function () {

    this._trie = {};

};

/**
 * Types of autocomplete. Properties:
 *  revRegExp - defines reversed matcher for autocomplete. Remembering parentheses defines part
 *              to match.
 *  split - defines character to split autocomplete. E.g. "test.me" and "test.my" for "te" will
 *          bring "st", not "st.me" or "st.my".
 *
 * @type {{common: {revRegExp: RegExp}}} // do not change certain type
 */
TerminalAutocomplete.prototype.TYPES = {
    common: {
        revRegExp: /([a-zA-Z]+)(\s.*)?/
    },
    class: {
        revRegExp: /(([a-zA-Z\.]*[a-zA-Z])?%?)\(ssalc##\s.*/,
        split: "."
    }
};

/**
 * @param {object} append
 * @param {string} part
 * @param {TerminalAutocomplete.prototype.TYPES} [type]
 * @private
 */
TerminalAutocomplete.prototype._appendEndings = function (append, part, type) {

    var level = this._trie,
        i;

    /**
     * @param {object} o
     * @param {string} ending
     */
    var search = function (o, ending) {

        for (i in o) {
            if (i === type["split"] && ending !== "") {
                append[ending] = 1; // todo: get lexeme relevance
                // continue
            } else if (i !== "\n") {
                search(o[i], ending + i);
            } else if (ending !== "" && o[i] === type) {
                append[ending] = 1; // todo: get lexeme relevance
            }
        }

    };

    for (i = 0; i < part.length; i++) {
        level = level[part[i]];
        if (!level) return;
    }

    search(level, "");

};

/**
 * @param {string} string - String where to search for endings.
 * @returns {Array} - Sorted autocomplete variants by relevance.
 */
TerminalAutocomplete.prototype.getEndings = function (string) {

    var i, matcher, wordPart,
        variants = {},
        array = [];

    string = string.split("").reverse().join("");

    for (i in this.TYPES) {
        matcher = this.TYPES[i].revRegExp || this.TYPES.common.revRegExp;
        wordPart = string.match(matcher)[1];
        if (wordPart) {
            this._appendEndings(variants, wordPart.split("").reverse().join(""), this.TYPES[i]);
        }
    }

    for (i in variants) {
        array.push(i);
    }

    array.sort(function (a, b) {
        return variants[a] - variants[b];
    });

    return array;

};

/**
 * @param {TerminalAutocomplete.prototype.TYPES} type
 * @param {string} lexeme
 */
TerminalAutocomplete.prototype.register = function (type, lexeme) {

    var level = this._trie,
        i;

    for (i = 0; i < lexeme.length; i++) {
        if (level.hasOwnProperty(lexeme[i])) {
            level = level[lexeme[i]];
        } else {
            level = level[lexeme[i]] = {};
        }
    }

    level["\n"] = type;

};