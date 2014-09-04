/**
 * Autocomplete mechanism of terminal.
 *
 * @constructor
 */
var TerminalAutocomplete = function () {

    /**
     * Main trie to complete in global "namespace".
     *
     * @private
     */
    this._trie = {};

    /**
     * Holds data of type { namespace: trie, ns2: trie2, ... }
     *
     * @private
     */
    this._namespaceTries = {

    };

    /**
     * Current namespace. Setting up namespace will cause autocomplete to search for corresponding
     * property in this._namespaceTries.
     *
     * Autocomplete search will be performed for two tries: this._trie and
     * this._namespaceTries[this.NAMESPACE].
     *
     * @type {string}
     */
    this.NAMESPACE = "";

};

/**
 * Types of autocomplete. this.getEndings call will match each of this expressions and search for
 * endings for matched part (that is between remembering brackets "(" and ")" in regular
 * expression).
 *
 * Possible properties:
 *  revRegExp - defines reversed matcher for autocomplete. Remembering parentheses defines part
 *              to match.
 *              For example, string "do the ro" will become "or eht od" when matching.
 *  split - defines character to split autocomplete. E.g. "test.me" and "test.my" for "te" will
 *          bring "st", not "st.me" or "st.my".
 *  priority - matched group except one with highest priority will be dismissed.
 */
TerminalAutocomplete.prototype.TYPES = {
    common: {
        regExp: /([a-zA-Z][a-z0-9A-Z]*)$/
    },
    keyword: {
        regExp: /([\$#\/]*[a-zA-Z]*[a-z0-9A-Z]*)$/i
    },
    class: {
        regExp: /##class\((%?[a-zA-Z]*[a-zA-Z0-9\.]*)$/,
        priority: 1,
        split: "."
    },
    subclass: {
        regExp: /##class\((%?[a-zA-Z]*[a-zA-Z0-9\.]*)\)\.(%?[a-zA-Z]*[a-zA-Z0-9]*)$/,
        priority: 1
    },
    globals: {
        regExp: /\^(%?[a-z0-9A-Z]*)/
    }
};

/**
 * @param {string} namespace
 */
TerminalAutocomplete.prototype.setNamespace = function (namespace) {
    this.NAMESPACE = namespace;
};

/**
 * @param {object} append
 * @param {string} part
 * @param {object} type
 * @returns {boolean} - If variants was found.
 * @private
 */
TerminalAutocomplete.prototype._appendEndings = function (append, part, type) {

    var i;

    var addVariant = function (variant, relevance) {
        append[variant] = relevance;
    };

    /**
     * @param {object} o
     * @param {string} ending
     */
    var search = function (o, ending) {

        for (i in o) {
            if (i === type["split"] && ending !== "") {
                addVariant(ending, 0);
            } else if (i === "\n") {
                if (ending !== "" && o[i].type === type) {
                    addVariant(ending, 0);
                }
            } else if (i !== "type") {
                search(o[i], ending + i);
            }
        }

    };

    var findLevel = function (rootLevel) {

        for (i = 0; i < part.length; i++) {
            rootLevel = rootLevel[part[i]];
            if (!rootLevel) {
                return;
            }
        }

        search(rootLevel, "");

    };

    findLevel(this._trie);
    findLevel(this._namespaceTries[this.NAMESPACE] || {});

};

/**
 * @param {string} string - String where to search for endings.
 * @returns {Array} - Sorted autocomplete variants by relevance.
 */
TerminalAutocomplete.prototype.getEndings = function (string) {

    var i, matcher, trieString,
        variants = {},
        array = [],
        priority = 0,

        MAX_LENGTH = 60; // limit the AC length for performance reasons

    string = string.substr(string.length - MAX_LENGTH, MAX_LENGTH);

    for (i in this.TYPES) {
        matcher = this.TYPES[i].regExp || this.TYPES.common.regExp;
        trieString = (string.match(matcher) || []).slice(1).join("\n");
        if (trieString) {
            if (this.TYPES[i].priority > priority) {
                variants = {};
                priority = this.TYPES[i].priority;
                this._appendEndings(variants, trieString, this.TYPES[i]);
            } else if (this.TYPES[i].priority || 0 === priority) {
                this._appendEndings(variants, trieString, this.TYPES[i]);
            } // else do not append
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
 * @param {string|undefined} [namespace] - If set to undefined, lexeme will be registered in global
 *                                         namespace.
 * @param {string[]} [parents] - Parents to which child will be appended.
 */
TerminalAutocomplete.prototype.register = function (type, lexeme, namespace, parents) {

    var level = namespace
            ? this._namespaceTries[namespace] || (this._namespaceTries[namespace] = {})
            : this._trie,
        i;

    //console.log("Registering", lexeme, "in", namespace || "%", "withing", parents);

    if (parents) {
        lexeme = (parents || []).join("\n") + "\n" + lexeme;
    }

    for (i = 0; i < lexeme.length; i++) {
        if (level.hasOwnProperty(lexeme[i])) {
            level = level[lexeme[i]];
        } else {
            level = level[lexeme[i]] = {};
        }
    }

    level["\n"] = { type: type };

};