import { SYMBOL_WIDTH, SYMBOL_HEIGHT, TOP_LINE_INDEX, getCursorX, getCursorY } from "../output";
import { output as outputElement } from "../elements";

const CLASS_NAME = "caret";

/**
 * @type {HTMLElement}
 */
let element = document.createElement(`div`);
element.className = CLASS_NAME;

export function update () {
    
    element.style.left =
        `${ (getCursorX() - 1) * SYMBOL_WIDTH }px`;
    element.style.top =
        `${ TOP_LINE_INDEX * SYMBOL_HEIGHT + (getCursorY() - 1) * SYMBOL_HEIGHT }px`;
    
    if (!element.parentNode)
        outputElement.appendChild(element);
    
}

export function hide () {

    if (element.parentNode)
        element.parentNode.removeChild(element);
    
}