import * as server from "../server";
import * as output from "../output";

const TRACE_CHECK_INTERVAL = 1000;

let tracing = [],
    timeout = 0;

export function getList () {
    return tracing.map(e => "\x1b[(" + (e[0] === "^" ? "global" : "string") + ")m" + e
        + "\x1b[0m").join(", ");
}

export function start (v) {
    if (tracing.indexOf(v) !== -1)
        return;
    tracing.push(v);
    if (timeout === 0)
        timeout = setTimeout(checkTrace, TRACE_CHECK_INTERVAL);
}

export function stop (v) {
    if (!v) {
        tracing = [];
        if (timeout) clearTimeout(timeout);
        return;
    }
    tracing = tracing.filter(e => e !== v);
    if (tracing.length > 0)
        return;
    if (timeout) {
        clearTimeout(timeout);
        timeout = 0;
    }
}

function checkTrace () {
    if (tracing.length === 0) {
        timeout = 0;
        return;
    }
    server.send("TracingStatus", {}, (obj) => {
        if (obj["changes"]) {
            output.printAsync(obj["changes"]);
        }
        for (let p in obj["stop"]) {
            stop(p);
        }
        timeout = setTimeout(checkTrace, TRACE_CHECK_INTERVAL);
    });
}