import * as output from "./index";
import { COLOR_8BIT } from "./const";

/**
 * DO NOT use output.print function inside: it may bring unexpected result as print function uses
 * stack. 
 */
export default {
    "\n": () => {
        if (output.SCROLLING_ENABLED) {
            // todo
        } else {
            if (output.getCursorY() >= output.HEIGHT)
                output.pushLines(1);
            output.setCursorY(output.getCursorY() + 1);
        }
    },
    "\r": () => {
        output.setCursorX(1);
    },
    "\t": () => {
        let x = output.getCursorX(),
            tabs = output.getTabs();
        for (let i = 0; i < tabs.length; i++) {
            if (x <= tabs[i]) {
                output.setCursorX(tabs[i]);
                return;
            }
        }
    },
    "\x1b[{\\d*};{\\d*}H": (args) => { // cursor home
        console.log("\\cursor!", args); // todo
    },
    "\x1b[{\\d*};\"{[^\"]}\"p": (args) => { // define key
        console.log("\\key!", args); // todo
    },
    "\x1b[{\\d+(?:;\\d+)*}m": (args) => {
        let indices = args[0].split(`;`);
        for (let i = 0; i < indices.length; i++) {
            if (indices[i] === 0)
                output.resetGraphicProperties();
            if ((indices[i] === 38 || indices[i] === 48) && indices[i + 1] === 5) {
                output.setGraphicProperty(
                    indices[i],
                    `m${indices[i]}`,
                    `${indices[i] === 48 ? "background-" : ""}color:${ COLOR_8BIT[indices[i + 2]] }`
                );
                i += 2;
                continue;
            }
            output.setGraphicProperty(indices[i], `m${indices[i]}`);
        }
    }
}