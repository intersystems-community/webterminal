let toCall = [],
    initialized = false;

/**
 * Execute callback when application is ready.
 * @param {function} cb
 */
export function onInit (cb) {
    if (initialized) {
        cb();
        return;
    }
    toCall.push(cb);
}

/**
 * 
 */
export function initDone () {
    initialized = true;
    toCall.forEach(f => f());
}