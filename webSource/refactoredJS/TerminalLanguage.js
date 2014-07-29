/**
 * Terminal language object. It is used in autocomplete.
 *
 * Object consists of other objects which determines program language. That's no meter how to call
 * first-level objects of [tokens] - that's just for perception. Language units must have properties
 * of type number, which determines importance of language unit usage. Properties beginning with the
 * symbol "!" are the control properties. They determining extra rules for language unit.
 * Functionality of this properties is the next:
 *     "!autocomplete": reversed regular expression for autocomplete. Note the follow:
 *       + To search unit in any position join ".*" to the end of expression. There's no meter to
 *         add this if you expecting unit to be placed at the beginning of string, such as system
 *         commands.
 *       + Insert brackets to regular expression in position which have to match with properties
 *         (language units)
 *       + Do not forget to write REVERSED regular expression for your expectations.
 */
var TerminalLanguage = function () {

    /**
     * Tokens language object. RULES:
     *  Autocomplete parsing will be performed for any object in {tokens} which has "!autocomplete"
     *  property and reversedRegExp property inside. There are two optional parameters:
     *    + separator (no default) - brakes autocomplete variants by parts. For example, it can be
     *      point symbol "."
     *    + caseSensitive (true) - makes variants case-sensitive. Make sure that non-sensitive
     *      variants defined as lowercase.
     *    + child (no default) - parse autocomplete for child. In this case properties of current
     *      object have to be objects with the same structure as parent. {child} also can have
     *      reversedRegExp, which will stand as a postfix for parent regular expression.
     *
     *  reversedRegExp MUST have at least one pair of remembering parentheses - this where parser
     *  will search matches.
     *
     *  @private
     */
    this._tokens = {

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
    };

};

/**
 * Inserts new class definition.
 *
 * May be better to rewrite.
 *
 * @param {string} name
 * @param {object} token
 */
TerminalLanguage.prototype.addClassToken = function (name, token) { // adds class to tokens

    if (!this._tokens.class.hasOwnProperty(name)) {
        this._tokens.class[name] = token;
    } else {
        //this._tokens.class[name].merge(classToken); @changed CWTv2
        mergeObjects(this._tokens.class[name], token);
    }

};

/**
 * Inserts new global definition.
 *
 * @param {string} name
 * @param {*} token
 */
TerminalLanguage.prototype.addGlobalToken = function (name, token) { // adds class to tokens

    if (!this._tokens.global.hasOwnProperty(name)) {
        this._tokens.global[name] = token;
    } else {
        // this._tokens.global[name].merge(globalToken); @changed CWTv2
        mergeObjects(this._tokens.global[name], token);
    }

};

/**
 * Creates user's language token for given name.
 *
 * @param {string} name - Name of language unit.
 */
TerminalLanguage.prototype.addUserToken = function (name) {

    var r = new RegExp("[a-zA-Z][a-zA-Z0-9]*");

    if (!r.test(name)) {
        console.error("Wrong user token \"" + name + "\".", "Token does not match " + r);
        return;
    }

    if (!this._tokens.user.hasOwnProperty(name)) {
        this._tokens.user[name] = 0;
    }

};

/**
 * Removes user language token(s) for given name.
 *
 * @param {string|"*"} name - Name of token to remove. If parameter equals to "*", all tokens will
 *                            be removed.
 */
TerminalLanguage.prototype.removeUserToken = function (name) {

    var t;
    
    if (name === "*") {
        for (t in this._tokens.user) {
            if (!this._tokens.user.hasOwnProperty(t) || t.charAt(0) === "!") continue;
            delete this._tokens.user[t];
        }
        return;
    }
    
    if (this._tokens.user.hasOwnProperty(name)) {
        delete this._tokens.user[name];
    }
    
};

/**
 * Add a set of classes placed in classTokens objects
 *
 * @param {object} tokens
 */
TerminalLanguage.prototype.addClassTokens = function (tokens) {

    var property;

    if (typeof tokens != "object") {
        log.write("language.addClasses error: argument is not an object.")
    }

    for (property in tokens) {
        if (!tokens.hasOwnProperty(property)) continue;
        this.addClassToken(property, tokens[property]);
    }

};

/**
 * Add a set of globals in globalTokens objects
 *
 * @param {object} tokens
 */
TerminalLanguage.prototype.addGlobalTokens = function (tokens) {

    var property;

    if (typeof tokens != "object") {
        log.write("language.addGlobals error: argument is not an object.")
    }

    for (property in tokens) {
        if (!tokens.hasOwnProperty(property)) continue;
        this.addGlobalToken(property, tokens[property]);
    }

};

/**
 * Finds in string required tokens and adds/removes it to/from Cache language. E.g. "set test = 12"
 * or "s test = 12" will add "test" to tokens.user, and "kill test" or "k test" will remove "test"
 * token.
 *
 * @param {string} string
 */
TerminalLanguage.prototype.parseForCachéTokens = function (string) {

    var re = new RegExp(
            "[\\s\\{](set|s)\\s(([a-zA-Z][a-zA-Z0-9]*)|(\\^[a-zA-Z][a-z\\.A-Z0-9]*))\\s*=",
            "ig"
        ),
        result = re.exec(string);
    
    string = " " + string + "  "; // keep two spaces
    
    if (result && result[2]) {
        if (result[2].charAt(0) === "^") {
            this._tokens.global[result[2].substr(1)] = 0;
        } else {
            this.addUserToken(result[2]);
        }
    }

    re = new RegExp(
        "[\\s\\{](k|kill)\\s(([a-zA-Z][a-zA-Z0-9]*)|(\\^[a-zA-Z][a-z\\.A-Z0-9]*))[\\s\\}]",
        "ig"
    );
    result = re.exec(string);

    if (result && result[2]) {
        if (result[2].charAt(0) === "^"
            && this._tokens.global.hasOwnProperty(result[2].substr(1))) {
                delete this._tokens.global[result[2].substr(1)];
        } else this.removeUserToken(result[2]);
    }

    re = new RegExp("[\\s\\{](k|kill)[\\s]+?[^a-zA-Z]","ig");
    result = re.exec(string);

    if (result && result[1]) {
        this.removeUserToken("*");
    }

};

/**
 * Exports terminal language to object.
 *
 * @returns {string}
 */
TerminalLanguage.prototype.exportJSON = function () {
    return JSON.stringify(this);
};

/**
 * Imports language from exported object.
 *
 * @param {string} json
 */
TerminalLanguage.prototype.importJSON = function (json) {

    var data, i;

    try {
        data = JSON.parse(json);
        for (i in this) {
            if (!this.hasOwnProperty(i)) continue;
            this[i] = data[i] || this[i];
        }
    } catch (e) { console.error(e); }

};