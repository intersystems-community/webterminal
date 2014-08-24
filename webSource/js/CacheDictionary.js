/**
 * Terminal dictionary object. Stores all defined keywords and rules for Caché language.
 */
var CacheDictionary = function () {

    this.keywords = [
        "break",
        "catch",
        "close",
        "continue",
        "do",
        "d",
        "else",
        "elseif",
        "for",
        "goto",
        "halt",
        "hang",
        "h",
        "if",
        "job",
        "j",
        "kill",
        "k",
        "lock",
        "l",
        "merge",
        "new",
        "open",
        "quit",
        "q",
        "read",
        "r",
        "return",
        "set",
        "s",
        "tcommit",
        "throw",
        "trollback",
        "try",
        "tstart",
        "use",
        "view",
        "while",
        "write",
        "w",
        "xecute",
        "x",
        "zkill",
        "znspace",
        "zn",
        "ztrap",
        "zwrite",
        "zw",
        "zzdump",
        "zzwrite",
        "print",
        "zbreak",
        "zinsert",
        "zload",
        "zprint",
        "zremove",
        "zsave",
        "zzprint",
        "mv",
        "mvcall",
        "mvcrt",
        "mvdim",
        "mvprint",
        "zquit",
        "zsync",
        "ascii",
        "$bit",
        "$bitcount",
        "$bitfind",
        "$bitlogic",
        "$case",
        "$char",
        "$classmethod",
        "$classname",
        "$compile",
        "$data",
        "$decimal",
        "$double",
        "$extract",
        "$factor",
        "$find",
        "$fnumber",
        "$get",
        "$increment",
        "$inumber",
        "$isobject",
        "$isvaliddouble",
        "$isvalidnum",
        "$justify",
        "$length",
        "$list",
        "$listbuild",
        "$listdata",
        "$listfind",
        "$listfromstring",
        "$listget",
        "$listlength",
        "$listnext",
        "$listsame",
        "$listtostring",
        "$listvalid",
        "$locate",
        "$match",
        "$method",
        "$name",
        "$nconvert",
        "$next",
        "$normalize",
        "$now",
        "$number",
        "$order",
        "$parameter",
        "$piece",
        "$prefetchoff",
        "$prefetchon",
        "$property",
        "$qlength",
        "$qsubscript",
        "$query",
        "$random",
        "$replace",
        "$reverse",
        "$sconvert",
        "$select",
        "$sortbegin",
        "$sortend",
        "$stack",
        "$text",
        "$translate",
        "$view",
        "$wascii",
        "$wchar",
        "$wextract",
        "$wfind",
        "$wiswide",
        "$wlength",
        "$wreverse",
        "$xecute",
        "$zabs",
        "$zarccos",
        "$zarcsin",
        "$zarctan",
        "$zcos",
        "$zcot",
        "$zcsc",
        "$zdate",
        "$zdateh",
        "$zdatetime",
        "$zdatetimeh",
        "$zexp",
        "$zhex",
        "$zln",
        "$zlog",
        "$zpower",
        "$zsec",
        "$zsin",
        "$zsqr",
        "$ztan",
        "$ztime",
        "$ztimeh",
        "$zboolean",
        "$zconvert",
        "$zcrc",
        "$zcyc",
        "$zdascii",
        "$zdchar",
        "$zf",
        "$ziswide",
        "$zlascii",
        "$zlchar",
        "$zname",
        "$zposition",
        "$zqascii",
        "$zqchar",
        "$zsearch",
        "$zseek",
        "$zstrip",
        "$zwascii",
        "$zwchar",
        "$zwidth",
        "$zwpack",
        "$zwbpack",
        "$zwunpack",
        "$zwbunpack",
        "$zzenkaku",
        "$change",
        "$mv",
        "$mvat",
        "$mvfmt",
        "$mvfmts",
        "$mviconv",
        "$mviconvs",
        "$mvinmat",
        "$mvlover",
        "$mvoconv",
        "$mvoconvs",
        "$mvraise",
        "$mvtrans",
        "$mvv",
        "$mvname",
        "$zbitand",
        "$zbitcount",
        "$zbitfind",
        "$zbitget",
        "$zbitlen",
        "$zbitnot",
        "$zbitor",
        "$zbitset",
        "$zbitstr",
        "$zbitxor",
        "$zincrement",
        "$znext",
        "$zorder",
        "$zprevious",
        "$zsort",
        "device",
        "$ecode",
        "$estack",
        "$etrap",
        "$halt",
        "$horolog",
        "$io",
        "$job",
        "$key",
        "$namespace",
        "$principal",
        "$quit",
        "$roles",
        "$storage",
        "$system",
        "$test",
        "$this",
        "$tlevel",
        "$username",
        "$x",
        "$y",
        "$za",
        "$zb",
        "$zchild",
        "$zeof",
        "$zeos",
        "$zerror",
        "$zhorolog",
        "$zio",
        "$zjob",
        "$zmode",
        "$znspace",
        "$zparent",
        "$zpi",
        "$zpos",
        "$zreference",
        "$zstorage",
        "$ztimestamp",
        "$ztimezone",
        "$ztrap",
        "$zversion"
    ];

};

/**
 * Inserts new class definition.
 *
 * May be better to rewrite.
 *
 * @param {string} name
 * @param {object} token
 */
CacheDictionary.prototype.addClassToken = function (name, token) { // adds class to tokens

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
CacheDictionary.prototype.addGlobalToken = function (name, token) { // adds class to tokens

    if (!this._tokens.global.hasOwnProperty(name)) {
        this._tokens.global[name] = token;
    } else {
        // this._tokens.global[name].merge(globalToken); @changed CWTv2
        mergeObjects(this._tokens.global[name], token);
    }

};

/**
 * Creates user's dictionary token for given name.
 *
 * @param {string} name - Name of dictionary unit.
 */
CacheDictionary.prototype.addUserToken = function (name) {

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
 * Removes user dictionary token(s) for given name.
 *
 * @param {string|"*"} name - Name of token to remove. If parameter equals to "*", all tokens will
 *                            be removed.
 */
CacheDictionary.prototype.removeUserToken = function (name) {

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
CacheDictionary.prototype.addClassTokens = function (tokens) {

    var property;

    if (typeof tokens !== "object") {
        console.error("Argument is not an object.");
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
CacheDictionary.prototype.addGlobalTokens = function (tokens) {

    var property;

    if (typeof tokens !== "object") {
        console.error("Error: argument is not an object.")
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
CacheDictionary.prototype.parseForCacheTokens = function (string) {

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
 * Exports terminal dictionary to object.
 *
 * @returns {string}
 */
CacheDictionary.prototype.exportJSON = function () {
    return JSON.stringify(this);
};

/**
 * Imports dictionary from exported object.
 *
 * @param {string} json
 */
CacheDictionary.prototype.importJSON = function (json) {

    var data, i;

    try {
        data = JSON.parse(json);
        for (i in this) {
            if (!this.hasOwnProperty(i)) continue;
            this[i] = data[i] || this[i];
        }
    } catch (e) { console.error(e); }

};