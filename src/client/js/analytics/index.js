import * as terminal from "../index";
import * as storage from "../storage";

const STORAGE_NAME = "terminal-guid";

function guid () {
    let g = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        let r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8; return v.toString(16);
    });
    storage.set(STORAGE_NAME, g);
    return g;
}

export function collect (initData = {}) {

    let local = location.hostname === "localhost" || location.hostname === "127.0.0.1";

    window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;

    ga("create", "/* @echo package.gaID */", !local ? "auto" : {
        clientId: initData["InstanceGUID"] || storage.get(STORAGE_NAME) || guid()
    });
    ga("set", "appName", "WebTerminal");
    ga("set", "appVersion", terminal.VERSION);
    ga("set", "screenName", local ? "Local" : "Remote");
    if (initData["zv"]) ga("set", "appInstallerId", initData["zv"]);
    ga("send", "pageview");

}
