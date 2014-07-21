/**
 * Every parser tasks are performed only with strings.
 */
var parser = new function() {

    /**
     * Converts text with html-tags and entities to normal plaintext string.
     *
     * @param string
     * @returns {string}
     *
    this.HTMLtoText = function(string) {
        var div = document.createElement("div"); // @GC
        div.innerHTML = string;
        var text = div.textContent || div.innerText || string.replace(/<br\s?\/?>/g,"\n").replace(/<\/?[^>]+(>|$)/g,"");
        return text || "";
    };
     */

    /**
     * Function clears html tab characters and entities.
     *
     * @param string
     * @returns {string}
     */
    this.clearHTML = function(string) {
        return string.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
    };

    /**
     * Reverses the string.
     *
     * @param string
     * @returns {string}
     */
    this.reverse = function(string) {
        return string.split("").reverse().join("");
    };

    /**
     * Analyzing stringPart, function returns correct name of element to use.
     * Usage: for example, to form highlighting "class" attribute. "set" -> "-set"
     * "$function" -> "-f_function", "$$$macro" -> "-m_macro" etc.
     *
     * @param stringPart
     *  Part of string, which name needed to return.
     */
    var parserSyntaxGetAttrName = function(stringPart) {

        var result = null;
        stringPart = stringPart.toLowerCase();
        if (typeof terminal !== "undefined" && terminal.language.tokens.commands.hasOwnProperty(stringPart)) {
            result = "_command"
        } else if (stringPart.match(/^[a-zA-Z][a-zA-Z0-9]*$/)) { // simple words
            result = stringPart.toLowerCase();
        } else if (stringPart.match(/^[0-9]+\.?[0-9]+$/)) {
            result = "_digit"
        } else if (stringPart.match(/^".*"$/)) {
            result = "_string"
        } else if (stringPart.match(/^\/[a-z]+$/)) {
            result = "_client"
        } else if (stringPart.match(/^\$[a-zA-Z][a-zA-Z0-9]*$/)) {
            result = "_function"
        } else if (stringPart.match(/^\$\$[a-zA-Z][a-zA-Z0-9]*$/)) {
            result = "_userFunction"
        } else if (stringPart.match(/^[{}\]\[\(\)]+$/)) {
            result = "_bracket"
        } else if (stringPart.match(/^\^%?[a-zA-Z][a-zA-Z0-9]*$/)) {
            result = "_global"
        } else if (stringPart.match(/^##[a-zA-Z][a-zA-Z0-9]*$/)) {
            result = "_sysMacro"
        } else if (stringPart.match(/^\.\.[a-zA-Z][a-zA-Z0-9]*$/)) {
            result = "_classProp"
        } else if (stringPart.match(/^\$\$\$[a-zA-Z][a-zA-Z0-9]*$/)) {
            result = "_macro"
        } else if (stringPart.match(/^[\+\-=\*\/<>\\!_'#\?]+$/)) {
            result = "_symbol"
        } else if (stringPart.match(/^(\/\*.*?(?=\*\/)\*\/)$/)) {
            result = "_comment"
        } else { result = "_other" }
        return (result)?"-"+result:result;

    };

    /**
     * Function breaks code for parts with span tags and according styles, but skips &*; html-symbol combinations and tag <br>
     *
     * @param string
     *  String to parse.
     * @returns {string}
     *  Parsed string.
     */
    this.highlightHTML = function(string) {
        if (typeof settings !== "undefined" && !settings.highlightOutput()) return string;
        return string.replace(/(\/\*.*?(?=\*\/)\*\/)|([0-9]+\.?[0-9]+?)|(((<|&|&#)|(\^%?)|\/|\${0,3}|#{0,2}|%|\.|(\.\.))?[A-Za-z0-9]+[;>]?)|[{}\]\[\(\)!_'\\#\?\+\-\*\/=<>,]|("[^"]*")/g,
            function(part) {
                return "<span class=\"syntax" + parserSyntaxGetAttrName(part) + "\">" + part + "</span>";
            });
    };

    /**
     * Converts position in plaintext string to it's html position. Works only with correct-html strings: tags has
     * theirs closures and HTML-entities represented as &<anySymbols>;
     *
     * @param string
     * @param position
     */
    this.convertPositionForHTML = function(string,position) {

        var i = 0, l = string.length, pos = 0;
        while (i<l && pos<position) {
            if (string[i]=="&") {
                var m = string.substr(i+1,5).match(/(nbsp|lt|gt|amp|#09);/g);
                if (m) i += m[0].length;
            } else if (string[i]=="<") {
                var p = string.indexOf(">",i+1);
                var inside = string.substring(i+1,p);
                if (inside == "br" || inside.substr(0,3) == "br/" || inside.substr(0,3) == "br ") {
                    pos++;
                }
                if (p==-1) { i = pos = l-1 } else { i += p-i; pos--; }
            }
            pos++; i++;
        }
        return i;

    };

    /**
     * Dummy converting JSON string to object.
     *
     * @param json {string}
     */
    this.jsonToObject = function(json) {
        if (JSON && JSON.parse) return JSON.parse(json);
        var a = null;
        eval("a = " + json);
        return a;
    };

    /**
     * Dummy converting object to JSON string.
     *
     * @param object
     */
    this.objectToJson = function(object) {
        if (typeof object !== "object" || typeof JSON === "undefined") return "";
        return JSON.stringify(object);
    };

    /**
     * Inserts caret <span> object to given HTML string.
     *
     * @param string
     * @param position
     * @returns {string}
     */
    this.insertCaret = function(string,position) {
        position = this.convertPositionForHTML(string,position);
        return string.splice(position,0,"<span id=\"caret\"></span>");
    };

    /**
     * Returns parsed string by given rules.
     *
     * @param string
     * [ @param insertCaretPos ]
     * [ @param highlight ]
     * [ @param insertSuggestion ]
     * @returns {string}
     */
    this.prepareForOutputHTML = function(string,insertCaretPos,highlight,insertSuggestion) {

        if (typeof insertCaretPos == "undefined") insertCaretPos = -1;
        if (typeof highlight == "undefined") highlight = true;
        if (typeof insertSuggestion == "undefined") insertSuggestion = "";
        if (insertSuggestion == 1) { insertSuggestion = terminal.autocompletion.getSuggestion() }
        if (insertSuggestion) insertSuggestion = "<span class=\"terminal-suggestion\">" + insertSuggestion + "</span>";

        string = string.replace(/[&<>]/g,function(part,index){
            var r = "";
            switch (part) {
                case "&": r = "&amp;"; break;
                case "<": r = "&lt;"; break;
                case ">": r = "&gt;"; break;
            }
            if (!insertCaretPos || r === "") {
                return r || part;
            }
            if (index < insertCaretPos) {
                //insertCaretPos += r.length - part.length; // seek caret
            }
            return r;
        });

        if (highlight) string = this.highlightHTML(string);
        if (insertCaretPos > -1) {
            if (insertSuggestion) {
                var pos = this.convertPositionForHTML(string,insertCaretPos);
                string = string.splice(pos,0,insertSuggestion);
            }
            if (application.browser != "ie") {
                string = this.insertCaret(string,insertCaretPos);
            }
        }

        return string;

    };

    /**
     * Receive all available autocomplete variants as an array.
     */
    this.getAutocomplete = function(string,position) {

        // limitations: \s, \n, next-letter
        var nextChar = string.charAt(position),
            currentChar = string.charAt(position-1);
        if (nextChar.match(/[a-zA-Z]/) || currentChar.match(/\s/)) return {};

        // part to parse: reversed+" "
        var part = string.substring(0,position).trim(),
            variants = {
                length: 0,
                data: {
                    /*
                    "nding": { // name - part variant
                        origin: {
                            // origin autocomplete object reference
                        },
                        full: "ending", // full variant
                        part: "nding", // part variant
                        p: 1 // order priority
                    }
                     */
                }
            };

        var getEndings = function(object, startPart, separator, caseSensitive) {
            var lowerCase;
            lowerCase = true;
            if (!caseSensitive) {
                if (!startPart) return;
                if (startPart[startPart.length-1].match(/[A-Z]/)) lowerCase = false;
                startPart = startPart.toLowerCase();
            }
            for (var fullPart in object) {
                if (!object.hasOwnProperty(fullPart) || typeof object != "object") continue;

                if (fullPart.indexOf(startPart) === 0 && fullPart.length != startPart.length) {
                    if (fullPart.charAt(0) === "!") continue;
                    var part = fullPart.substr(startPart.length);
                    if (separator) part = part.split(separator)[0];
                    if (!variants["data"].hasOwnProperty(part)) {
                        var freq = object[fullPart];
                        if (typeof freq !== "number") {
                            if (!freq.hasOwnProperty("!p")) freq["!p"] = 0;
                            freq = freq["!p"];
                        }
                        variants["data"][part] = {
                            origin: object,
                            full: fullPart,
                            part: (lowerCase)?part:part.toUpperCase(),
                            p: freq
                        };
                        variants["length"]++;
                    }
                }
            }
        };
        
        var parseObject = function(languageObject, string) {

            for (var unit in languageObject) {

                if (!languageObject.hasOwnProperty(unit) ||
                    !(languageObject[unit].hasOwnProperty("!autocomplete"))) continue;

                var parameters = languageObject[unit]["!autocomplete"];
                if (!parameters) continue;
                if (typeof parameters["caseSensitive"] === "undefined") parameters["caseSensitive"] = true;

                if (parameters["child"] && parameters["child"]["reversedRegExp"]) { // scanning for child elements
                    var combinedRegExp = new RegExp(parameters["child"]["reversedRegExp"] +
                        parameters["reversedRegExp"]);
                    var childResult = combinedRegExp.exec(string);
                    if (childResult && childResult.index === 0 && childResult[2]) {
                        var parentName = parser.reverse(childResult[2]);
                        if (languageObject[unit].hasOwnProperty(parentName)) {
                            getEndings(languageObject[unit][parentName], parser.reverse(childResult[1]),
                                parameters["child"]["separator"], parameters["caseSensitive"])
                        }
                    }
                }

                var regExp = new RegExp(parameters["reversedRegExp"]),
                    result = regExp.exec(string);
                if (result && result.index === 0 && result[1]) {
                    getEndings(languageObject[unit], parser.reverse(result[1]), parameters["separator"],
                        parameters["caseSensitive"])
                }

            }

        };

        parseObject(terminal.language.tokens,this.reverse(part)+" ");

        return variants;

    };

};