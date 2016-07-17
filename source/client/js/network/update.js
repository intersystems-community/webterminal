import * as terminal from "../index";
import * as output from "../output";
import * as input from "../input";
import * as locale from "../localization";

let UPDATING = false;

window.updateTerminal = function (version, url) {
    if (UPDATING)
        return;
    UPDATING = true;
    input.clearPrompt();
    output.printLine(locale.get(`updStart`, terminal.VERSION, version));
    output.printLine(`URL: ${ url }`);
    output.printLine(`Todo!`);
    input.reprompt();
};