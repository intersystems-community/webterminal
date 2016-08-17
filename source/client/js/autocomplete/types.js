import * as server from "../server";

function collectOfType (collector, type) {
    let arr = [];
    for (let i = collector.length - 1; i >= 0; i--) {
        if (collector[i].type !== type)
            break;
        arr.push(collector[i].value);
    }
    return arr.reverse().join("");
}

export default {
    "classname": (collector, cb) => {
        let subStr = collectOfType(collector, "classname");
        server.send("ClassAutocomplete", subStr, (d) => {
            if (!d || !(d.length > 0))
                return;
            cb(d.split(",").map(s => {
                let dotPos = s.indexOf(".", subStr.length);
                return dotPos > 0
                    ? s.substring(subStr.length, dotPos + 1)
                    : s.substr(subStr.length);
            }).filter((s, i, arr) => arr[i - 1] ? arr[i - 1] !== s : true));
        });
    }
}