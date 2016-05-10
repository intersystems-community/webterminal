/**
 * Returns a new spliced string.
 *
 * @param {number} position
 * @param {number} length
 * @param {string} string
 * @returns {string}
 */
String.prototype.splice = function(position, length, string) {
    return (this.slice(0,position) + string + this.slice(position + Math.abs(length)));
};

var AJAX = new function() {

    /**
     * Handler for request.
     *
     * @callback requestCallback
     * @param {string} data
     * @param {boolean} [error]
     */

    /**
     * Gets data from server and handles.
     *
     * @param url
     * @param {requestCallback} callback
     * @param [caching=false] - Cache the result.
     */
    this.get = function (url, callback, caching) {

        var request = new XMLHttpRequest(),
            s;

        caching = "cache=" + ((caching) ? 1 : Math.random());

        request.onreadystatechange = function() {

            if (request.readyState === 4) {

                if (request.status === 200) {
                    callback.call(window, request.responseText, false);
                } else {
                    callback.call(window, "", true);
                }

            }

        };

        s = (url.indexOf("?") === -1) ? "?" : "&";

        try {
            request.open("GET", url + s + caching, true);
            request.send();
        } catch (e) {
            // huh?
        }

    };

};

var lib = new (function () {

    this.image = {
        favicon: "data:image/x-icon;base64,AAABAAEAEBAAAAAAAABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAD///8BAAAABQAAABEAAAAJAAAAAwAAAAMAAAAD////Af///wH///8B////Af///wH///8B////Af///wH///8B////AQAAAAcAAAAVLyoiXzcxJa09NijfPjcp4YiHhcWbm5ypioqLhWtrbF8vLy85AAAAIQAAAAP///8B////AXt7fBGFhYZHiomLRXFua0FEPzNPOjMkY1dSSceqqqr/vLy9/7a2t/+vr7D/kZGS4wAAABkAAAAbAAAAFf///wGXlZKPq6qg57GtlK2vqIqjsaySt6+qlcOvr5/1t7es/76+t//GxsT/zMzM98fIyIW8vLxDwcHBKY6Njg////8BioZ8j5aTjpkUERGjHRIS4SIVFM8oGRa9Mh8ZrUc0KatfTT2tdWROsYZ1XauciHGVt6aQl7uwnp/GxLPRuLi2gYyIfo+XlJCZCQgIzQAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8IBgX/Eg8O5bOwpXuOi4CPmZaSmQgIB80AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wICAfGqqKB3kY2Cj5yZlJkIBwfNAAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8FBATtpaKcd5SQhY+em5eZCAcHzQAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wUFBf8aGhr/Li0s65+dl3WXk4iPop+amQgHB80AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AQEB/xISEv8mJib/MjIy/zk3NumamJJ1m5eMj6WinZkHBwfPXV1d/wcHB/9PT0//V1dX/0tLS/8AAAD/BQUF/xkZGf8nJyf/MjIy/zw8PP9CPz3nlJKNdZ+bj5GopZ+ZBwcHz25ubv+qqqr/ODg4/zg4OP8pKSn/CAgI/xwcHP8oKCj/MzMz/zw8PP9DQ0P/SENB55COiXOin5KRq6iimQcHBs9gYGD/m5ub/wAAAP8AAAD/DQ0N/x0dHf8oKCj/MzMz/z09Pf9DQ0P/R0dH/0pFQ+WMioVzpaGUkaunoZ8ICAjPc3Nz/wcHB/0GBgb1FBMT7x4eHecqKSfhNTMx3T89OttIRUHZT0xH2VVSTNtwbWTflZOQibKwrYe4tanplpGCs4uDcamblIOto52Ot6Gcj7+fmo69nZmNs5qWi6mVkombjoyFjYaFgH9/f3xxfXx9Y3t8fi+npqYbsbKyU7m4uE2/v787srKxKY+OjxdtbW0H////Af///wH///8B////Af///wH///8B////Af///wH///8B//8AAPA/AAD8DwAAAA8AAAAAAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAAAAAAADwAA//8AAA=="
    };

})();

/**
 * Initialization function. Exported after build.
 *
 * @param {string} [authKey]
 * @param {string} namespace
 */
window.createTerminal = function (authKey, namespace) {

    var term;

    document.getElementById("favicon").href = lib.image.favicon;

    term = new Terminal({
        container: document.body,
        authKey: authKey || null,
        defaultNamespace: namespace
    });

    // fix for not active input on terminal window (fix placed here, because whole terminal app
    // can be embedded into another app and input focus can cause by-effect)
    window.addEventListener("keydown", function (e) {
        if (!e.ctrlKey && !e.shiftKey && !e.altKey
            && term.elements.input !== document.activeElement) {
            term.input.focus();
        }
    });

    return term;

};