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
            if (output.getCursorY() + 1 > output.HEIGHT) {
                output.pushLines(1);
            }
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
            if (x < tabs[i]) {
                output.setCursorX(tabs[i]);
                return;
            }
        }
    },
    "\x1bH": () => {
        output.setTabAt(output.getCursorX());
    },
    "\x1b[g": () => {
        output.clearTab(output.getCursorX());
    },
    "\x1b[3g": () => {
        output.clearTab();
    },
    "\x1b[{\\d*}{;?}{\\d*}H": (args) => { // cursor home
        if (args[0] || args[2]) {
            if (args[0])
                output.setCursorY(+args[0]);
            if (args[2])
                output.setCursorX(+args[2]);
        } else {
            output.setCursorX(1);
            output.setCursorY(1);
        }
    },
    "\x1b[{\\d*}G": (args) => {
        output.setCursorX(+args[0]);
    },
    "\x1b[{\\d*};\"{[^\"]}\"p": (args) => { // define key
        console.log("\\key!", args); // todo
    },
    "\x1b[{\\d+(?:;\\d+)*}m": (args) => {
        let indices = args[0].split(`;`);
        for (let i = 0; i < indices.length; i++) {
            if (indices[i] === "0") {
                output.resetGraphicProperties();
                continue;
            }
            if ((indices[i] === 38 || indices[i] === 48) && indices[i + 1] === 5) {
                output.setGraphicProperty(indices[i], {
                    class: `m${indices[i]}`,
                    style: `${indices[i] === 48 ? "background-" : ""}color:${ COLOR_8BIT[indices[i + 2]] }`
                });
                i += 2;
                continue;
            }
            output.setGraphicProperty(indices[i], {
                class: `m${indices[i]}`
            });
        }
    },
    "\x1b[({[\\w\\-]+})m": (args) => { // print element of class
        let cls = args[0];
        if (!cls)
            return;
        output.setGraphicProperty(9, { class: cls });
    },
    "\x1b!URL={[^\\x20]*} ({[^\\)]+})": ([url, text]) => {
        output.setGraphicProperty(9, {
            tag: "a",
            attrs: {
                href: url,
                target: "_blank"
            }
        });
        output.immediatePlainPrint(text);
        output.clearGraphicProperty(9);
    }
}