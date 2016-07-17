import * as terminal from "../index";
import * as output from "../output";
import * as input from "../input";
import * as locale from "../localization";
import * as server from "../server";

let UPDATING = false;

window.updateTerminal = function (version, url) {
    if (UPDATING)
        return;
    UPDATING = true;
    input.clearPrompt();
    output.printLine(locale.get(`updStart`, terminal.VERSION, version));
    output.printLine(`URL: ${ url }`);
    output.printLine(locale.get(`rSerUpd`));
    server.send(`Update`, url);
};