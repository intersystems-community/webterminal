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

/**
 * Merges two objects recursively that each property of sourceObject will appear in object. Note
 * that if property of sourceObject is an object, to "object" will be copied only a reference to
 * this object.
 *
 * @param {object} object - Object where new properties will be inserted.
 * @param {object} sourceObject - Object to copy properties from.
 */
var mergeObjectProperties = function (object, sourceObject) {

    var property;

    for (property in sourceObject) {

        sourceObject[property] = object[property];

    }

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

/**
 * Initialization function. Exported after build.
 */
this.createTerminal = function () {

    return new Terminal({
        container: document.body
    });

};