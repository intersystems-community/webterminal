/**
 * Output line used as instance for rendering terminal content.
 *
 * @param {number} INDEX
 * @constructor
 */
var TerminalOutputLine = function (INDEX) {

    var lineElement = document.createElement("div"),
        __this = this,
        linePlainText = "",
        graphicRenditionIndex = {

        }; // { "stringPos": [attributes array] }

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
            i,
            lineText = "",
            temp;

        for (i in graphicRenditionIndex) {
            positions.push(parseInt(i));
        }

        positions.sort(function(a, b) { return a - b; });

        if (positions[0] !== 0) positions.unshift(0);

        for (i = 0; i < positions.length; i++) {
            temp = (graphicRenditionIndex[positions[i]] || []).join(" term-gri");
            if (temp) temp = "<span class=\"term-gri" + temp + "\">";
            lineText += temp + linePlainText.substring(
                    positions[i] || 0,
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

        if (thereIsAnyCurrentGraphicRendition()) {

            // set new attributes
            for (i in CURRENT_GRAPHIC_RENDITION) {
                if (!graphicRenditionIndex.hasOwnProperty(position.toString())) // force > out block
                    graphicRenditionIndex[position] = [];
                graphicRenditionIndex[position].push(i);
            }

        } else {
            graphicRenditionIndex[position] = [];
        }

        __this.render();

        return text.substr(writePart.length, text.length);

    };

};/**
 * Created by ZitRo on 28.07.2014.
 */
