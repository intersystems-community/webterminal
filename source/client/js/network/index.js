import { get } from "../lib";
import * as input from "../input";
import * as terminal from "../index";
import * as output from "../output";

get("http://intersystems-ru.github.io/webterminal/terminal.json", (data = {}) => {
    if (data.error || typeof data.motd === "undefined")
        return;
    terminal.onAuth(() => handleNetworkData(data));
});

function handleNetworkData (data) {
    input.clearPrompt();
    if (data.motd)
        output.printLine(data.motd);
    input.reprompt();
}