let toCall = [],
    initialized = false,
    terminal = null;

/**
 * Execute callback when application is ready.
 * @param {function} cb
 */
export function onInit (cb) {
    if (initialized) {
        cb(terminal);
        return;
    }
    toCall.push(cb);
}

/**
 * Triggered by WebTerminal when initialization is done.
 */
export function initDone (webTerminal) {
    terminal = webTerminal;
    initialized = true;
    toCall.forEach(f => f(terminal));
}

/**
 * Handles WebTerminal's initialization.
 * @callback terminalInitCallback
 * @param {Terminal} terminal
 */