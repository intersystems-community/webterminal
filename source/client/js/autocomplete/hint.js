import * as output from "../output";
import * as caret from "../input/caret";
import { output as outputElement } from "../elements";

let MAX_HINTS = 5;

function Hint () {

    this.visible = false;

    this.element = document.createElement("div");
    this.element.className = "hintBox";
    this.element.style.display = "none";
    // this.nestedElement = document.createElement("div");
    // this.element.appendChild(this.nestedElement);
    outputElement.appendChild(this.element);

    this.maxVariantLength = 10;
    this.displayUnder = true;
    this.displayInLine = true;
    this.lastSeek = 1;
    this.firstDisplay = true;

    /**
     * @type {string[]}
     */
    this.variants = [];
    this.variant = 0;

}

Hint.prototype.add = function (hints = []) {

    if (!(hints instanceof Array))
        hints = [hints];

    this.reset();
    this.variants = hints.map((h) => {
        if (h.length > this.maxVariantLength)
            this.maxVariantLength = h.length;
        return { value: h, element: null };
    });

    if (this.variants.length) {
        this.update();
        this.show();
    } else {
        this.hide();
    }

};

Hint.prototype.reset = function () {
    this.element.textContent = "";
    this.variants = [];
    this.variant = 0;
    this.lastSeek = 0;
    this.maxVariantLength = 0;
    this.firstDisplay = true;
};

Hint.prototype.get = function () {
    return (this.variants[this.variant] || {}).value || "";
};

Hint.prototype.next = function (counter = 1) {
    let oldVar = this.variant;
    this.variant = (this.variant + counter + this.variants.length) % this.variants.length;
    if (oldVar !== this.variant)
        this.lastSeek = this.variant - oldVar;
    this.updateVariants();
};

Hint.prototype.updateVariants = function () {

    if (!this.visible)
        return;

    let displayable = this.variants.slice(this.variant, this.variant + MAX_HINTS),
        property = this.displayUnder ? "top" : "bottom";

    function displayed (e) {
        for (let a of displayable) { if (a.element === e) return a; } return null;
    }

    for (let n of this.element.childNodes) {
        if (displayed(n) || n.DECAY)
            continue;
        n.DECAY = true;
        n.style[property] =
            `${ parseFloat(n.style[property]) - this.lastSeek * output.SYMBOL_HEIGHT }px`;
        n.style.opacity = 0;
        setTimeout(() => { if (n.parentNode) n.parentNode.removeChild(n); }, 300);
    }

    for (let i = 0; i < displayable.length; i++) {
        let v = displayable[i];
        if (!v.element || v.element.DECAY) {
            let seek = Math.sign(this.lastSeek) * Math.min(Math.abs(this.lastSeek), MAX_HINTS);
            v.element = document.createElement(`div`);
            v.element.textContent = v.value;
            if (!this.firstDisplay)
                v.element.style.opacity = 0;
            v.element.style[property] = `${
                (i + seek) * output.SYMBOL_HEIGHT
            }px`;
            this.element.appendChild(v.element);
        }
        setTimeout(((v) => () => {
            v.style[property] = `${ i * output.SYMBOL_HEIGHT }px`;
            v.style.opacity = 1;
        })(v.element), 25);
    }

};

Hint.prototype.update = function () {

    if (!this.visible)
        return;

    let linesNumber = output.getLinesNumber(),
        lineIndex = output.getTopLineIndex() + caret.getY(),
        x = caret.getX(),
        width = Math.min(this.maxVariantLength, Math.ceil(output.WIDTH / 2)),
        height = Math.min(MAX_HINTS, this.variants.length);

    this.displayInLine = x + width < output.WIDTH;
    this.displayUnder = lineIndex + height + 1 < Math.max(linesNumber, output.HEIGHT);
    // console.log(`Display under: ${ this.displayUnder }, in line: ${ this.displayInLine }`);
    this.element.style.top = `${
        ((this.displayUnder ? lineIndex + 1: lineIndex - height)
        + (this.displayInLine ? this.displayUnder ? -1 : 1 : 0)) * output.SYMBOL_HEIGHT
    }px`;
    this.element.style.left = `${ Math.min(x, output.WIDTH - width) * output.SYMBOL_WIDTH }px`;
    this.element.style.width = `${ width * output.SYMBOL_WIDTH }px`;
    this.element.style.height = `${ height * output.SYMBOL_HEIGHT }px`;

    this.updateVariants();

    this.firstDisplay = false;

};

Hint.prototype.show = function () {
    if (this.visible)
        return;
    this.visible = true;
    this.update();
    this.element.style.display = "block";
};

Hint.prototype.hide = function () {
    if (!this.visible)
        return;
    this.visible = false;
    this.element.style.display = "none";
};

export default new Hint();