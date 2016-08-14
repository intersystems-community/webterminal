import { SYMBOL_WIDTH, SYMBOL_HEIGHT, TOP_LINE_INDEX, getCursorX, getCursorY } from "../output";
import { output as outputElement } from "../elements";

const CLASS_NAME = "caret";
const IS_IE = window.navigator.userAgent.indexOf("MSIE ") !== -1
    || window.navigator.userAgent.indexOf("Trident/") !== -1;

/**
 * @type {HTMLElement}
 */
let element = document.createElement(`div`);
element.className = CLASS_NAME;

let x = 0,
    y = 0;

export function getX () {
    return x;
}

export function getY () {
    return y;
}

/**
 * Updates the caret position and visibility.
 */
export function update () {
    
    element.style.left =
        `${ (x = getCursorX() - 1) * SYMBOL_WIDTH }px`;
    element.style.top =
        `${ TOP_LINE_INDEX * SYMBOL_HEIGHT + (y = getCursorY() - 1) * SYMBOL_HEIGHT }px`;

    if (IS_IE) // do not show caret in older IE: it has it's own input caret
        return;

    if (!element.parentNode)
        outputElement.appendChild(element);
    
}

/**
 * Hides the caret.
 */
export function hide () {

    if (element.parentNode)
        element.parentNode.removeChild(element);
    
}