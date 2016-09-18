import { images, onWindowLoad } from "./lib";

/**
 * DOM controller for terminal. Initializes all terminal elements.
 *
 * Terminal structure:
 * <div class="terminal"> - terminal window which will fill parent by 100% width and 100% height
 *     <input class="input"/> - floating input
 *     <div class="output">
 *         <div class="line"></div>
 *         ...
 *     </div>
 * </div>
 */

let e = (tag, cls) => {
    let t = document.createElement(tag);
    if (cls)
        t.className = cls;
    return t;
};

export const terminal = e(`div`, `terminal`);
export const output = e(`div`, `output`);
export const input = e(`textarea`, `input`);
export const themeLink = e(`link`);
export const faviconLink = e(`link`);

faviconLink.setAttribute(`rel`, `shortcut icon`);
faviconLink.setAttribute(`href`,images.favicon);
themeLink.setAttribute("rel", "stylesheet");
terminal.appendChild(output);

onWindowLoad(() => {
    document.head.appendChild(faviconLink);
    document.head.appendChild(themeLink);
    document.body.appendChild(terminal);
});

/*
TerminalElements.prototype._initialize = function (parentElement) {

    var centralizer = document.createElement("div"),
        centralizerInner = document.createElement("div");

    this.terminal.className = "terminalContainer";
    centralizer.className = "terminalOutputCentralizer";
    this.input.className = "terminalInput";
    this.output.className = "terminalOutput";

    this.terminal.appendChild(this.input);
    centralizerInner.appendChild(this.output);
    centralizer.appendChild(centralizerInner);
    this.terminal.appendChild(centralizer);
    parentElement.appendChild(this.terminal);

    this.themeLink.id = "terminal-theme";
    this.themeLink.setAttribute("rel", "stylesheet");
    this.terminal.appendChild(this.themeLink);

};
*/