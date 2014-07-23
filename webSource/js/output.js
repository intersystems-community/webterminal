var LINE_ID_NAME = "terminal-line-",
    LINE_CLASSNAME = "terminalLine";

/**
 * Represents output and everything related to it.
 * todo: reorganise "animations" usage
 * todo: remove "highlight output" option
 * todo: fix terminal overflow crash
 */
var Output = function() {

    /**
     * @param {number} INDEX
     * @constructor
     */
    var TerminalLine = function(INDEX) {

        var lineElement = document.createElement("div"),
            __this = this,
            linePlainText = "",
            graphicRenditionIndex = {}; // { "stringPos": [attributes] }

        /**
         * Initialisation.
         */
        (function(){

            lineElement.id = LINE_ID_NAME + INDEX;
            lineElement.className = LINE_CLASSNAME;
            lineElement.style.height = SEGMENT_PIXEL_HEIGHT + "px";

            dom.objects.output.appendChild(lineElement);

        }());

        /**
         * Renders linePlainText to html.
         */
        this.render = function() {

            var positions = [],
                i, lineText = "";

            for (i in graphicRenditionIndex) {
                positions.push(i);
            }

            positions.sort(function(a, b) { return a > b; });

            //console.log(graphicRenditionIndex, positions);

            for (i = 0; i < positions.length; i++) {
                lineText += "<span class=\"" + graphicRenditionIndex[positions[i]].join(" ")
                    + "\">" + linePlainText.substring(
                            positions[i - 1] || 0,
                            positions[i + 1] || linePlainText.length
                        ).replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</span>";
            }

            if (!lineText) lineText = linePlainText.replace(/&/g, "&amp;").replace(/</g, "&lt;");

            lineElement.innerHTML = lineText;

        };

        /**
         * Writes plain text to line starting from position. If line overflows, overflowing text
         * won't be appended to line and will be returned.
         *
         * @param {string} text - Bare text without any non-character symbols. Any html character
         *                        will be replaced with matching entities.
         * @param {number} [position]
         * @returns {string}
         */
        this.writePlain = function(text, position) {

            var i;

            if (typeof position === "undefined") position = linePlainText.length;

            var writePart = text.substr(0, _this.width - linePlainText.length); // position? huh?

            if (position > linePlainText.length) {
                for (i = linePlainText.length; i <= position; i++) {
                    linePlainText += " ";
                }
            }

            linePlainText = linePlainText.splice(position, writePart.length, writePart);

            // seek any graphic rendition indexes to the end of writable part
            for (i = position; i < writePart.length; i++) {
                if (graphicRenditionIndex.hasOwnProperty(i.toString())) {
                    graphicRenditionIndex[writePart.length] =
                        (graphicRenditionIndex[writePart.length] || [])
                            .concat(graphicRenditionIndex[i]);
                    delete graphicRenditionIndex[i];
                }
            }

            // todo: clear graphicRenditionIndex[writePart.length] array

            // set new attributes
            for (i in CURRENT_GRAPHIC_RENDITION) {
                if (!graphicRenditionIndex.hasOwnProperty(position.toString())) // force > out block
                    graphicRenditionIndex[position] = [];
                graphicRenditionIndex[position].push(i);
            }

            __this.render();

            return text.substr(writePart.length, text.length);

        };

    };

    /**
     * Output stack. A string including everything related to output and used to update terminal
     * output once per ~25ms
     *
     * @type {string}
     */
    var stack = "",

        /**
         * @type {HTMLElement|null}
         * @deprecated - CWTv2: Terminal has only one output target.
         */
        target = null,

        /**
         * @type {boolean}
         * @deprecated - Rebase marking mechanism.
         */
        mark = false,

        _this = this,

        /**
         * Current line number beginning from 0. Used in output control.
         *
         * @type {number}
         */
        TOP_LINE = 0,

        /**
         * @type {number}
         */
        SEGMENT_PIXEL_WIDTH = 0,
        SEGMENT_PIXEL_HEIGHT = 0,

        CONTROL_SEQUENCE_PATTERN = /[\r\n]|\x1b[^@-~]*[@-~]/g, // todo: fix and debug

        CURRENT_GRAPHIC_RENDITION = {},// { "attribute": true }

        /**
         * Line elements.
         *
         * @type {TerminalLine[]}
         */
        _lines = [];

    var setCaretX = function(x) {
        _this.caret.x = Math.max(1, Math.min(_this.width, x));
    };

    var setCaretY = function(y) {
        _this.caret.y = Math.max(1, Math.min(_this.height, y));
    };

    /**
     * Caret position.
     *
     * @type {{x: number, y: number}}
     */
    this.caret = {
        x: 1,
        y: 1
    };

    this.width = 0;
    this.height = 0;

    /**
     * @param {number} delta - Positive to scroll down.
     */
    var scrollDisplay = function(delta) {

        if (delta > 0) {
            TOP_LINE += delta;
        } else {
            console.warn("todo?");
        }

    };

    /**
     * @param {number} effect
     */
    var selectGraphicRendition = function(effect) {

        if (effect === 0) {
            CURRENT_GRAPHIC_RENDITION = {};
        } else {
            CURRENT_GRAPHIC_RENDITION[effect] = true;
        }

    };

    /**
     * Receives sequence to parse and apply.
     *
     * @param {string} sequence
     */
    var applyControlSequence = function(sequence) {

        console.log("Sequence:", sequence);

        if (sequence === "\r") {
            setCaretX(1);
        } else if (sequence === "\n") {
            if (_this.caret.y === _this.height) {
                scrollDisplay(1);
            }
            setCaretY(_this.caret.y + 1);
        } else if (sequence.match(/\x1b\[[0-9]+m/)) {
            var code = parseInt(sequence.match(/[0-9]+/)[0]);
            if (code === 0) {
                CURRENT_GRAPHIC_RENDITION = {};
            } else {
                CURRENT_GRAPHIC_RENDITION[code] = true;
            }
        }

    };

    /**
     * Outputs plain text to caret position (x;y) to terminal.
     *
     * @param text
     */
    var outPlainText = function(text) {

        var line, xDelta;

        do {

            line = getCurrentLine();

            xDelta = text.length;
            text = line.writePlain(text, _this.caret.x - 1);
            xDelta -= text.length;

            if (text) {
                applyControlSequence("\r");
                applyControlSequence("\n");
            } else setCaretX(_this.caret.x + xDelta);

        } while (text);

    };

    var spawnLines = function(number) {

        for (var i = 0; i < number; i++) {
            _lines.push(new TerminalLine(_lines.length));
        }

    };

    /**
     * @returns {TerminalLine}
     */
    var getCurrentLine = function() {

        var i = TOP_LINE + (_this.caret.y - 1);

        for (var u = _lines.length; u <= i; u++) {
            _lines[u] = new TerminalLine(u);
        }

        return _lines[i];

    };

    /**
     * Output and parse all control symbols.
     * @private
     */
    this._output = function(text) {

        var textOrigin = text,
            lastIndex = 0;

        text.replace(CONTROL_SEQUENCE_PATTERN, function(part, index, string) {
            var beforePart = string.substring(lastIndex, index);
            if (!lastIndex) textOrigin = string;
            lastIndex = index + part.length;
            if (beforePart) outPlainText(beforePart);
            applyControlSequence(part);
            return "";
        });

        var textLeft = textOrigin.substring(lastIndex, textOrigin.length);

        if (textLeft) outPlainText(textLeft);

    };

    var STACK_REFRESH_INTERVAL = 25;

    /**
     * Writes text to output as standalone message. If oldOutput defined, write will be forced to old output object.
     * Optional processEscape parameter will turn on escape characters processing for current output. This option
     * will be automatically turned off in case of any call of forceWrite function (turning once for current stack).
     * Also escape characters processing are unavailable for forceWrite call. To process escape-characters, set
     * html-container as a field of output, then perform forceWrite once with empty body, and then use write with
     * processEscape flag.
     *
     * @param text {string}
     * @param {boolean} [processEscape]
     */
    this.write = function(text, processEscape) {

        /*escapeCharactersProcessing = !!(processEscape);
         if (target == dom.objects.output) {
         this.forceWrite(text);
         } else {
         stack += text.replace('[0J','');
         }*/
        stack += text;

    };

    /**
     * Sets output target to object.
     *
     * @param object
     * @returns {boolean}
     * @deprecated - CWTv2: Terminal has only one output target.
     */
    this.setTarget = function(object) {
        target = object;
        return true;
    };

    /**
     * Clears output field.
     * @deprecated - CWTv2: use escape sequence instead.
     */
    this.clear = function() {

//        dom.clearOutput();
//        stack = "";
//
//        var t = document.createElement("DIV"); // @wrong
//        t.className = "terminal-message-body terminal-output-body"; // @absolute
//        dom.objects.output.appendChild(t); // @fix
//        target = t;
        scrollDisplay(_lines.length - TOP_LINE);
        spawnLines(_this.height);
        setCaretX(1);
        setCaretY(1);
        dom.scrollBottom();

    };

    /**
     * Marks down all marked log headers.
     */
    this.markDownAll = function() {
        if (mark == false) dom.performForClassObjects("waiting", function(object){
            object.className = object.className.replace(/waiting/g,"complete")
        });
    };

    /**
     * Writing output to object immediately.
     *
     * @param text
     * @param [marking] - Shows if it needed to mark log as "executing". Mark will still
     *                    continue until another force write call.
     * @return {object} - Object to output to.
     */
    this.forceWrite = function(text, marking) {

        /*if (typeof marking == "undefined") marking = false;
         escapeCharactersProcessing = false;

         var div = document.createElement("div");
         div.id = "terminal-log-"+lastID++;
         div.className = "terminal-outputContainer animated01";
         if (marking) {
         div.style.opacity = "0";
         }

         var head = document.createElement("div");
         head.className = "terminal-message-head"+((marking)?" waiting":"");
         head.innerHTML = terminal.namespace.getMask();

         var body = document.createElement("div");
         body.className = "terminal-message-body terminal-output-body";
         body.innerHTML = text;

         div.appendChild(head);
         div.appendChild(body);
         target.appendChild(div);
         setTimeout(function(){div.style.opacity = "1";},1);

         dom.scrollBottom();

         return body;*/
        _this.freeStack();

    };

    this.freeStack = function(highlight) {

        /*if (!stack) return;

         if (settings.get_animations()) {
         var el = document.createElement("span");
         el.className = "animated01";
         el.innerHTML = (highlight)?parser.highlightHTML(stack):stack;
         el.style.opacity = "0";
         setTimeout(function(){ el.style.opacity = "1" }, 1);
         target.appendChild(el);
         } else {
         target.innerHTML += stack;
         }*/

        if (!stack) return;
        _this._output(stack);
        dom.scrollBottom();
        stack = "";

    };

    /**
     * Window size change handler. Recalculates terminal size.
     */
    this.sizeChanged = function() {

        var tel = document.createElement("span");

        dom.objects.output.appendChild(tel);
        tel.innerHTML = "X";

        SEGMENT_PIXEL_WIDTH = tel.offsetWidth;
        SEGMENT_PIXEL_HEIGHT = tel.offsetHeight;

        _this.width = Math.floor(dom.objects.terminal.offsetWidth / SEGMENT_PIXEL_WIDTH);
        _this.height = Math.floor(dom.objects.terminal.offsetHeight / SEGMENT_PIXEL_HEIGHT);

        dom.objects.output.style.width = (_this.width * SEGMENT_PIXEL_WIDTH) + "px";
        dom.objects.output.style.height = (_this.height * SEGMENT_PIXEL_HEIGHT) + "px";

//        console.log(dom.objects.output.offsetWidth,
//            SEGMENT_PIXEL_WIDTH, SEGMENT_PIXEL_HEIGHT, _this.width, _this.height);
        // todo: fix FF, IE 1px font margin

        dom.objects.output.removeChild(tel);

    };

    setInterval(this.freeStack, STACK_REFRESH_INTERVAL); // refreshing output

};