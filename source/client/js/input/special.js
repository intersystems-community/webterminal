import * as locale from "../localization";
import * as output from "../output";

/**
 * Special commands handler. Each key of this object is a command of type "/<key>".
 */
export default {
    "help": () => {
        output.print(locale.get(`help`));
    },
    "info": () => {
        output.print(locale.get(`info`));
    }
}
