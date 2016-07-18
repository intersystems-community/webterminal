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
 * Register the callback which will be executed right after terminal is initialized. This callback
 * is simultaneously triggered if WebTerminal initialization is already done.
 * @param {terminalInitCallback} callback
 */
window.onTerminalInit = onInit;

/**
 * Handles WebTerminal's initialization.
 * @callback terminalInitCallback
 * @param {Terminal} terminal
 */