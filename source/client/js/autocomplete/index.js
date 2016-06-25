import grammar from "./grammar";
import "./suggestor";

/**
 * Differentiate strings, numbers and keywords, remove whitespaces.
 * @param {string} string
 */
function getLexicalString (string) {
    let arr = [],
        earr = [],
        i = 0;
    string.split(/[\s\t]+/g).forEach((e) => e.replace(
        /[a-zA-Z][a-zA-Z0-9\.]*|"[^"]*"|[0-9]+?(?:\.[0-9]+)?/gi,
        (s) => {
            let symb = s[0] === "\"" ? "\x02" : /[0-9]|\./.test(s[0]) ? "\x00" : "\x01";
            earr.push({ v: s, t: symb === "\x01" ? "$KWD" : "$VAL" });
            return symb;
        }
    ).split("").forEach(e => { if (/[\x00-\x02]/.test(e)) arr.push(earr[i++]); else arr.push(e) }));
    return arr;
}

function getStatePath (pathString) {
    let state = grammar;
    pathString.split(".").forEach(s => state = state[s] || NaN);
    if (!state) {
        console.error(`No state \"${ pathString }\" (1). Please, report this error to developer.`);
        state = grammar.commands;
    }
    return state;
}

/**
 * todo
 * @param state
 * @param {string} stringPart
 */
function getSuggestions (state, stringPart) {
    let suggestions = [];
    for (let s in state) {
        if (!s || (s.length > 1 && (s[0] === "!" || s[0] === "@" || s[0] === "$")))
            continue;
        if (s.indexOf(stringPart) !== 0)
            continue;
        if (s.length <= stringPart.length)
            continue;
        suggestions.push(s.substr(stringPart.length));
    }
    return suggestions;
}

/**
 * Suggest variants to complete string.
 * @param {string} string
 * @returns {{suggestion: string, state: *}}
 */
export function suggest (string) {
    if (!string)
        return {
            suggestion: "",
            suggestions: [],
            keyString: "",
            state: grammar.commands
        };
    let lex = getLexicalString(string),
        state = grammar.commands,
        suggestions, keyString,
        suggestion = "", stack = [], prop, abandoned = false;
    loop: for (let i = 0; i < lex.length + 1; i++) {
        console.log(`Pos ${i}/${lex.length - 1}, lex=`, lex[i], `, State=`, state);
        if (typeof state === "string") {
            i--;
            if (state === "!") {
                suggestion = "";
                state = stack.pop();
                console.log(`Popping stack, getting`, state);
                if (!state) {// reset state
                    console.log(`No stack, resetting state.`);
                    state = grammar.commands;
                }
                continue;
            }
            console.log(`Next state by ${state}`);
            state = getStatePath(state);
            continue;
        }
        // if (state["@suggestion"] && !suggestion) {
        //     suggestion = state["@suggestion"];
        //     // suggestions = getSuggestions()
        // }
        if (i > lex.length - 1 && !suggestion && (state["@suggestion"] || state["@suggest"])) {
            suggestion = state["@suggestion"] || "text";
            keyString = (lex[i - 1] || lex[i]).v || lex[i - 1] || lex[i];
            console.log(`Suggesting ${ suggestion } on ${ i } and ${lex[i - 1]}`, lex);
            if (state["@suggest"] === "*") {
                suggestions =
                    getSuggestions(state, keyString);
            } else if (state["@suggest"]) {
                suggestions =
                    state["@suggest"] instanceof Array ? state["@suggest"] : [state["@suggest"]];
            }
        }
        if (i > lex.length - 1 && suggestion && (state["@suggestion"] || state["@suggest"])) {
            keyString = (lex[i - 1] || lex[i]).v || lex[i - 1] || lex[i];
        }
        let lexeme = lex[i]; // Symbol like ")" or object { v: "set", t: "$KWD" }
        if (!lexeme)
            continue;
        if (state[prop = typeof lexeme === "string" ? lexeme : lexeme.v]) {
            console.log(`Next state on ${prop}`);
            state = state[prop];
            continue;
        }
        if (typeof lexeme === "object" && state[lexeme.t]) {
            console.log(`Next state on ${lexeme.t}`);
            state = state[lexeme.t];
            continue;
        }
        for (let st in state) {
            if (st[0] === "!") {
                i--;
                stack.push(state[st]);
                suggestion = "";
                state = grammar[st.substr(1)];
                if (!state) {
                    console.error(
                        `No state \"${st.substr(1)}\" (2). Please, report this error to developer.`
                    );
                    stack.pop();
                    state = grammar.commands;
                }
                console.log(`Next state stacked to ${ st.substr(1) } and now`, stack.join(","));
                continue loop;
            }
            if (st === "") {
                i--;
                console.log(`Next state on "": ${ state[st] }`);
                state = state[st];
                continue loop;
            }
        }
        console.log(`Popping stack`, stack.join(","));
        if (!(state = stack.pop())) {
            state = grammar.commands;
            if (abandoned) {
                abandoned = false;
            } else {
                i--;
            }
            abandoned = true;
        } else {
            i--;
            suggestion = "";
        }
        console.log(`Now state is`, state);
    }
    return {
        suggestion: suggestion,
        suggestions: suggestions || [],
        keyString: keyString || "",
        state: state
    };
}

// todo: remove after testing
window.suggest = suggest;
window.getLexicalString = getLexicalString;


// todo: remove old code after refactoring
// /**
//  * Autocomplete mechanism of terminal.
//  *
//  * @constructor
//  */
// var TerminalAutocomplete = function () {
//
//     /**
//      * Main trie to complete in global "namespace".
//      *
//      * @private
//      */
//     this._trie = {};
//
//     /**
//      * Holds data of type { namespace: trie, ns2: trie2, ... }
//      *
//      * @private
//      */
//     this._namespaceTries = {
//
//     };
//
//     /**
//      * Current namespace. Setting up namespace will cause autocomplete to search for corresponding
//      * property in this._namespaceTries.
//      *
//      * Autocomplete search will be performed for two tries: this._trie and
//      * this._namespaceTries[this.NAMESPACE].
//      *
//      * @type {string}
//      */
//     this.NAMESPACE = "";
//
// };
//
// /**
//  * Types of autocomplete. this.getEndings call will match each of this expressions and search for
//  * endings for matched part (that is between remembering brackets "(" and ")" in regular
//  * expression).
//  *
//  * Possible properties:
//  *  revRegExp - defines reversed matcher for autocomplete. Remembering parentheses defines part
//  *              to match.
//  *              For example, string "do the ro" will become "or eht od" when matching.
//  *  split - defines character to split autocomplete. E.g. "test.me" and "test.my" for "te" will
//  *          bring "st", not "st.me" or "st.my".
//  *  priority - matched group except one with highest priority will be dismissed.
//  */
// TerminalAutocomplete.prototype.TYPES = {
//     common: {
//         regExp: /([a-zA-Z][a-z0-9A-Z]*)$/
//     },
//     keyword: {
//         regExp: /([\$#\/]*[a-zA-Z]*[a-z0-9A-Z]*)$/i
//     },
//     class: {
//         regExp: /##class\((%?[a-zA-Z]*[a-zA-Z0-9\.]*)$/,
//         priority: 1,
//         split: "."
//     },
//     subclass: {
//         regExp: /##class\((%?[a-zA-Z]*[a-zA-Z0-9\.]*)\)\.((?:%|\$)?[a-zA-Z]*[a-zA-Z0-9]*)$/,
//         priority: 2
//     },
//     globals: {
//         regExp: /\^(%?[a-z0-9A-Z]*)/
//     }
// };
//
// /**
//  * @param {string} namespace
//  */
// TerminalAutocomplete.prototype.setNamespace = function (namespace) {
//     this.NAMESPACE = namespace;
// };
//
// /**
//  * @param {object} append
//  * @param {string} part
//  * @param {object} type
//  * @returns {boolean} - If variants was found.
//  * @private
//  */
// TerminalAutocomplete.prototype._appendEndings = function (append, part, type) {
//
//     var i;
//
//     var addVariant = function (variant, relevance) {
//         append[variant] = relevance;
//     };
//
//     /**
//      * @param {object} o
//      * @param {string} ending
//      */
//     var search = function (o, ending) {
//
//         for (i in o) {
//             if (i === type["split"] && ending !== "") {
//                 addVariant(ending, 0);
//             } else if (i === "\n") {
//                 if (ending !== "" && o[i].type === type) {
//                     addVariant(ending, 0);
//                 }
//             } else if (i !== "type") {
//                 search(o[i], ending + i);
//             }
//         }
//
//     };
//
//     var findLevel = function (rootLevel) {
//
//         for (i = 0; i < part.length; i++) {
//             rootLevel = rootLevel[part[i]];
//             if (!rootLevel) {
//                 return;
//             }
//         }
//
//         search(rootLevel, "");
//
//     };
//
//     findLevel(this._trie);
//     findLevel(this._namespaceTries[this.NAMESPACE] || {});
//
// };
//
// /**
//  * @param {string} string - String where to search for endings.
//  * @returns {Array} - Sorted autocomplete variants by relevance.
//  */
// TerminalAutocomplete.prototype.getEndings = function (string) {
//
//     var i, matcher, trieString,
//         variants = {},
//         array = [],
//         priority = 0,
//
//         MAX_LENGTH = 60; // limit the AC length for performance reasons
//
//     // skip autocomplete in strings
//     if ((string.match(/"/g) || []).length % 2 === 1) return [];
//
//     string = string.substr(
//         Math.max(string.length - MAX_LENGTH, 0),
//         Math.min(MAX_LENGTH, string.length)
//     );
//
//     for (i in this.TYPES) {
//         matcher = this.TYPES[i].regExp || this.TYPES.common.regExp;
//         trieString = (string.match(matcher) || []).slice(1).join("\n");
//         if (trieString) {
//             if (this.TYPES[i].priority > priority) {
//                 variants = {};
//                 priority = this.TYPES[i].priority;
//                 this._appendEndings(variants, trieString, this.TYPES[i]);
//             } else if ((this.TYPES[i].priority || 0) === priority) {
//                 this._appendEndings(variants, trieString, this.TYPES[i]);
//             } // else do not append
//         }
//     }
//
//     for (i in variants) {
//         array.push(i);
//     }
//
//     array.sort(function (a, b) {
//         return variants[a] - variants[b];
//     });
//
//     return array;
//
// };
//
// /**
//  * Register new autocomplete variant.
//  *
//  * @param type - TerminalAutocomplete.TYPES.*
//  * @param {string} lexeme
//  * @param {string|undefined} [namespace] - If set to undefined, lexeme will be registered in global
//  *                                         namespace.
//  * @param {string[]} [parents] - Parents to which child will be appended.
//  */
// TerminalAutocomplete.prototype.register = function (type, lexeme, namespace, parents) {
//
//     var level = namespace
//             ? this._namespaceTries[namespace] || (this._namespaceTries[namespace] = {})
//             : this._trie,
//         i;
//
//     if (parents) {
//         lexeme = (parents || []).join("\n") + "\n" + lexeme;
//     }
//
//     for (i = 0; i < lexeme.length; i++) {
//         if (level.hasOwnProperty(lexeme[i])) {
//             level = level[lexeme[i]];
//         } else {
//             level = level[lexeme[i]] = {};
//         }
//     }
//
//     level["\n"] = { type: type };
//
// };
//
// /**
//  * @param {string} lexeme
//  * @param {string} [namespace]  - If set to undefined, lexeme will be registered in global
//  *                                namespace.
//  * @param {string[]} [parents] - Parents to which child was appended.
//  */
// TerminalAutocomplete.prototype.clear = function (lexeme, namespace, parents) {
//
//     var level = namespace
//             ? this._namespaceTries[namespace] || (this._namespaceTries[namespace] = {})
//             : this._trie,
//         i;
//
//     if (parents) {
//         lexeme = (parents || []).join("\n") + "\n" + lexeme;
//     }
//
//     for (i = 0; i < lexeme.length; i++) {
//         if (level.hasOwnProperty(lexeme[i])) {
//             level = level[lexeme[i]];
//         } else {
//             level = level[lexeme[i]] = {};
//         }
//     }
//
//     if (level.hasOwnProperty("\n") && level["\n"].type) {
//         delete level["\n"].type;
//     }
//
// };
//
// TerminalAutocomplete.prototype.parseForCacheTokens = function (string) {
//
//     string = " " + string + "  "; // keep two spaces
//
//     var re = new RegExp(
//             "[\\s\\{](set|s)\\s(([a-zA-Z][a-zA-Z0-9]*)|(\\^[a-zA-Z][a-z\\.A-Z0-9]*))\\s*=",
//             "ig"
//         ),
//         result = re.exec(string);
//
//     if (result && result[2]) {
//         if (result[2].charAt(0) === "^") {
//             this.register(this.TYPES.globals, result[2].substr(1), this.NAMESPACE);
//         } else {
//             this.register(this.TYPES.common, result[2], this.NAMESPACE);
//         }
//     }
//
//     re = new RegExp(
//         "[\\s\\{](k|kill)\\s(([a-zA-Z][a-zA-Z0-9]*)|(\\^[a-zA-Z][a-z\\.A-Z0-9]*))[\\s\\}]",
//         "ig"
//     );
//     result = re.exec(string);
//
//     if (result && result[2]) {
//         if (result[2].charAt(0) === "^") {
//             this.clear(result[2].substr(1), this.NAMESPACE);
//         } else this.clear(result[2], this.NAMESPACE);
//     }
//
// };