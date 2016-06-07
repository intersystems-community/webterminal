import { SYMBOL_HEIGHT, WIDTH, GRAPHIC_PROPERTIES } from "./index";
import * as elements from "../elements";

export const LINE_CLASS_NAME = `line`;

/**
 * Output line used as instance for rendering terminal content.
 *
 * @param {number} index - Line top index.
 * @constructor
 */
export function Line (index) {

    /**
     * @type {HTMLElement}
     * @private
     */
    this._lineElement = document.createElement("div");
    this._lineElement.className = `line`;

    /**
     * Text of line which will be rendered.
     *
     * @private
     * @type {string}
     */
    this.text = "";

    /**
     * Line index.
     * @type {number}
     */
    this.INDEX = index;
    
    /**
     * Array of graphic properties. The null value symbolizes that reset is needed.
     * @type {Object<Number,Object<Number,null|{class:String,style:String}>>}
     */
    this.graphicProperties = {};

    this.setIndex(index);
    elements.output.appendChild(this._lineElement);

}

/**
 * @param {number} index - Line top index.
 */
Line.prototype.setIndex = function (index) {
    this.INDEX = index;
    this._lineElement.style.top = `${ index * SYMBOL_HEIGHT }px`;
};

/**
 * Renders text to html.
 */
Line.prototype.render = function () {

    let html = [],
        keys = Object.keys(this.graphicProperties),
        ind = [].concat(this.graphicProperties[0] ? [] : 0).concat(keys).concat(WIDTH);

    for (let i = 1; i < ind.length; i++) {
        let classes = [],
            styles = [],
            ps = this.graphicProperties[ind[i - 1]];
        for (let c in ps) {
            if (ps[c].class)
                classes.push(ps[c].class);
            if (ps[c].style)
                styles.push(ps[c].style);
        }
        html.push(`<span class="g${ classes.length ? " " + classes.join(" ") : "" }" style="${
            styles.join("") }">${
            this.text.substring(ind[i - 1], ind[i])
                .replace(/[&<]/g, s => s === "&" ? "&amp;" : "&lt;")
            }</span>`);
    }

    this._lineElement.innerHTML = html.join("");

    /*var positions = [],
        i,
        lineText = "",
        temp, styled;

    for (i in this.graphicProperties) {
        positions.push(parseInt(i));
    }

    //console.log(`Lime GM's:`, this.graphicProperties);

    positions.sort(function(a, b) { return a - b; });

    if (positions[0] !== 0) positions.unshift(0);

    for (i = 0; i < positions.length; i++) {
        temp = "g"; styled = "";
        for (let a in this.graphicProperties[positions[i]]) {
            temp += " m" + a;
            //if (a.style) styled += (styled ? ";" : "") + a.style + " ";
        }
        // (this.graphicProperties[positions[i]] || []).every(function(a) {
        //     temp += "m " + a.index;
        //     if (a.style) styled += (styled ? ";" : "") + a.style + " ";
        //     return true;
        // }, this);
        if (temp) temp = "<span class=\"" + temp + "\"" + (styled ? "style=\""
            + styled.replace("\"", "&quot;") + "\"" : "") + ">";
        lineText += temp + this.text.substring(
                positions[i] || 0,
                positions[i + 1] || this.text.length
        ).replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</span>";
    }

    if (!lineText) lineText = this.text.replace(/&/g, "&amp;").replace(/</g, "&lt;");

    this._lineElement.innerHTML = lineText;*/

};

/**
 * Writes plain text to line starting from position. If line overflows, overflowing text will be
 * returned.
 *
 * @param {string} text - Bare text without any non-character symbols. Any html character
 *                        will be replaced with matching entities.
 * @param {number} [position] - Position to insert text to.
 * @returns {string}
 */
Line.prototype.print = function (text, position = this.text.length) {

    let part = text.substr(0, WIDTH - position),
        isAnyGP = Object.keys(GRAPHIC_PROPERTIES).length,
        curPositions = Object.keys(this.graphicProperties);

    if (isAnyGP || (curPositions.length && !isAnyGP)) {
        let endPos = position + part.length,
            tempGP, hasAtEnd, before, toAssign;
        for (let i = 0; i < curPositions.length; i++) {
            let pos = curPositions[i];
            if (pos < position) {
                before = this.graphicProperties[pos];
                continue;
            }
            if (hasAtEnd = pos >= endPos)
                continue;
            if (!tempGP || this.graphicProperties[pos] === null) {
                delete this.graphicProperties[pos];
                tempGP = {};
            }
            for (let p in this.graphicProperties[pos]) {
                tempGP[p] = this.graphicProperties[pos][p];
                delete this.graphicProperties[pos];
            }
        }
        if (
            before !== (toAssign = isAnyGP ? Object.assign({}, GRAPHIC_PROPERTIES) : null)
            && (JSON.stringify(before) !== JSON.stringify(toAssign)) // prevent adding same props
        )
            this.graphicProperties[position] = toAssign;
        if (tempGP || !curPositions.length)
            this.graphicProperties[endPos] = tempGP || null;
        if (tempGP || hasAtEnd) {
            let o = {}, keys = Object.keys(this.graphicProperties).map(e=>+e).sort((a,b)=>a>b);
            for (let k of keys)
                o[k] = this.graphicProperties[k];
            this.graphicProperties = o;
        }
    }

    console.log(`line GP now`, this.graphicProperties);

    this.text = position < this.text.length
        ? this.text.substring(0, position) + part + this.text.substr(position + part.length)
        : this.text + new Array(position - this.text.length + 1).join(" ") + part;
    //this.render();
    return part.length === text.length ? "" : text.substr(part.length);

    /*var i, writePart;

    if (typeof position === "undefined") position = this.text.length;

    writePart = text.substr(0, WIDTH - position);

    if (position > this.text.length) {
        this.text += (new Array(position - this.text.length + 1)).join(" ");
    }

    this.text = this.text.splice(position, writePart.length, writePart);

    // seek any graphic rendition indexes to the end of writable part
    for (i = position; i < position + writePart.length; i++) {
        if (this.graphicProperties.hasOwnProperty(i.toString())) {
            this.graphicProperties[position + writePart.length] =
                (this.graphicProperties[position + writePart.length] || [])
                    .concat(this.graphicProperties[i]);
            delete this.graphicProperties[i];
        }
    }

    // optimize array: exclude zeros. I believe that tactics may be optimized.
    if (this.graphicProperties[position + writePart.length] instanceof Array) {
        for (i = 0; i < this.graphicProperties[position + writePart.length].length; i++) {
            if (this.graphicProperties[position + writePart.length][i].index === 0) {
                this.graphicProperties[position + writePart.length].splice(0, i + 1);
                i = 0;
            }
        }
        this.graphicProperties[position + writePart.length] =
            this.graphicProperties[position + writePart.length].filter(function(elem, pos, a) {
            for (i = 0; i < pos; i++) {
                if (a[pos].index === a[i].index) return false;
            }
            return true;
        });
    }

    let gm = getGraphicProperties();
    if (Object.keys(gm).length) {

        this.graphicProperties[position] = [];

        // set new attributes
        for (i in gm) {
            this.graphicProperties[position].push({
                index: parseInt(i) || i,
                style: gm[i].style
            });
        }

    } else {

        this.graphicProperties[position] = [{
            index: 0
        }];

    }

    if (!this.renderTimeout) {
        this.renderTimeout = setTimeout(() => {
            this.render();
            this.renderTimeout = 0;
        }, 25);
    }

    return text.substr(writePart.length, text.length);*/

};

/**
 * Erases line. This function is much faster than rendering line with whitespaces.
 */
Line.prototype.clear = function () {

    this.text = "";
    this.graphicProperties = {};
    this.render();

};

Line.prototype.remove = function () {

    if (this._lineElement.parentNode) {
        this._lineElement.parentNode.removeChild(this._lineElement);
    }

};