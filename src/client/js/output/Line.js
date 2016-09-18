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

    this.HTML_LINE = false;
    this.HTMLRendered = false;
    
    /**
     * Array of graphic properties. The null value symbolizes that reset is needed.
     * @type {(Number|{class:String,style:String,tag:string,attrs:Object<string,*>[]})[]}
     */
    this.graphicProperties = [];

    this.setIndex(index);
    this._lineElement.style.height = `${ SYMBOL_HEIGHT }px`;
    elements.output.appendChild(this._lineElement);

}

/**
 * @param {number} index - Line top index.
 */
Line.prototype.setIndex = function (index) {
    this.INDEX = index;
    this._lineElement.setAttribute("index", index);
    this._lineElement.style.top = `${ index * SYMBOL_HEIGHT }px`;
};

function getElement (gp, text) {
    let classes = ["g"],
        styles = [],
        tag = "span",
        attrs = [];
    for (let i = 0; i < gp.length; i += 2) {
        if (gp[i + 1].class)
            classes.push(gp[i + 1].class);
        if (gp[i + 1].styles)
            styles.push(gp[i + 1].styles);
        if (gp[i + 1].attrs)
            for (let a in gp[i + 1].attrs)
                attrs.push([a, gp[i + 1].attrs[a]]);
        if (gp[i + 1].tag)
            tag = gp[i + 1].tag;
    }
    let el = document.createElement(tag);
    el.className = classes.join(" ");
    if (styles.length)
        el.setAttribute("style", styles.join(";"));
    for (let a of attrs)
        el.setAttribute(a[0], a[1]);
    el.textContent = text;
    return el;
}

/**
 * Start treating line content as html. Removes it's actual content and replaces with "content".
 * @param content
 */
Line.prototype.setHTML = function (content) {
    this.HTML_LINE = true;
    this.text = content;
    this._lineElement.className = `html line`;
    this.HTMLRendered = false;
    this.render();
    this._lineElement.style.maxHeight =
        `${ Math.max(SYMBOL_HEIGHT, this._lineElement.offsetHeight) }px`;
};

Line.prototype.getHeight = function () {
    return this._lineElement.offsetHeight;
};

/**
 * Renders text to html.
 */
Line.prototype.render = function () {

    if (this.HTML_LINE) {
        if (this.HTMLRendered)
            return;
        this._lineElement.innerHTML = this.text;
        this.HTMLRendered = true;
        return;
    }

    let tempDisplay = this._lineElement.style.display;
    this._lineElement.style.display = "none";
    this._lineElement.innerHTML = "";

    let lastI = 0;
    for (let i = 0; i < this.text.length; i++) {
        if (typeof this.graphicProperties[i] === "undefined")
            continue;
        if (lastI !== i)
            this._lineElement.appendChild(
                getElement(this.graphicProperties[lastI] || [], this.text.substring(lastI, i))
            );
        lastI = i;
    }
    if (this.text.length > 0)
        this._lineElement.appendChild(
            getElement(this.graphicProperties[lastI] || [], this.text.substr(lastI))
        );

    // console.log(`Rendered with`, JSON.parse(JSON.stringify(this.graphicProperties)));

    this._lineElement.style.display = tempDisplay;

};

function collect (posArr, from = 0, to, init = [], clean = false) {
    let arr = init;
    for (let i = from; i < to; i++) {
        if (typeof posArr[i] === "undefined")
            continue;
        arr = posArr[i];
        if (clean)
            posArr[i] = undefined;
    }
    return arr;
}

function equal (arr1, arr2) {
    if (arr1.length !== arr2.length)
        return false;
    for (let i = 0; i < arr1.length; i++)
        if (arr1[i] !== arr2[i])
            return false;
    return true;
}

/**
 * Writes plain text to line starting from position. If line overflows, overflowing text will be
 * returned.
 *
 * @param {string} text - Bare text without any non-character symbols. Any html character
 *                        will be replaced with matching entities.
 * @param {number} [startPos] - Position to insert text to.
 * @returns {string}
 */
Line.prototype.print = function (text, startPos = this.text.length) {

    if (this.HTML_LINE) {
        this.HTML_LINE = false;
        this._lineElement.className = `line`;
        this._lineElement.style.maxHeight = ``;
        this.text = ``;
    }

    let part = text.substr(0, WIDTH - startPos),
        endPos = startPos + part.length;

    let before = collect(this.graphicProperties, 0, startPos, []),
        then = collect(this.graphicProperties, startPos, endPos, before, true);

    // console.log(`Printing from ${ startPos } ${ part.length } characters. Before:`, JSON.parse(JSON.stringify(before)), `Then:`, JSON.parse(JSON.stringify(then)));

    if (!equal(before, GRAPHIC_PROPERTIES))
        this.graphicProperties[startPos] = GRAPHIC_PROPERTIES.slice();
    // console.log(`( ${then.length}|| ${GRAPHIC_PROPERTIES.length}) && !${equal(then, GRAPHIC_PROPERTIES)} && ${position} + ${part.length} < ${text.length}`, JSON.parse(JSON.stringify(collect(this.graphicProperties, position + part.length, position + part.length + 1, then))));
    if ((then.length || GRAPHIC_PROPERTIES.length) && !equal(then, GRAPHIC_PROPERTIES) && endPos < this.text.length) {
        this.graphicProperties[endPos] = collect(this.graphicProperties, endPos, endPos + 1, then);
        if (GRAPHIC_PROPERTIES.length === 0 && this.graphicProperties[endPos].length === 0)
            this.graphicProperties[endPos] = undefined;
    }

    // console.log(`line GP now`, this.graphicProperties);

    this.text = startPos < this.text.length
        ? this.text.substring(0, startPos) + part + this.text.substr(endPos)
        : this.text + new Array(startPos - this.text.length + 1).join(" ") + part;
    //this.render();
    return part.length === text.length ? "" : text.substr(part.length);

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