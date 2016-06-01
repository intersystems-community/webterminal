import { SYMBOL_WIDTH, SYMBOL_HEIGHT, getCursorX, getCursorY } from "../output";
import { output } from "../elements";

const CLASS_NAME = "caret";

/**
 * @type {HTMLElement}
 */
let element = document.createElement(`div`);
element.className = CLASS_NAME;

export function update () {
    
    element.style.left = `${ (getCursorX() - 1) * SYMBOL_WIDTH }px`;
    element.style.top = `${ (getCursorY() - 1) * SYMBOL_HEIGHT }px`;
    
    if (!element.parentNode)
        output.appendChild(element);
    
}

export function hide () {

    if (element.parentNode)
        element.parentNode.removeChild(element);
    
}