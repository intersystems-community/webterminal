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

export function onWindowLoad (f) {
    if (window.addEventListener) {
        window.addEventListener(`load`, f)
    } else {
        window.attachEvent(`onload`, f)
    }
}

/**
 * Gets data from server and handles it.
 *
 * @param url
 * @param {function} callback
 */
export function get (url, callback) {

    var request = new XMLHttpRequest();

    request.onreadystatechange = () => {

        if (request.readyState === 4) {

            if (request.status === 200) {
                let p = { error: "Parse error", data: request.responseText };
                try { p = JSON.parse(request.responseText) } catch (e) {}
                callback(p);
            } else {
                callback({ error: `HTTP ${ request.status } error` });
            }

        }

    };

    try {
        request.open("GET", `${ url }?_=${ new Date().getTime() }`, true);
        request.send();
    } catch (e) {
        // huh?
        console.error(e);
    }

}

export const images = {
    favicon: "data:image/x-icon;base64,AAABAAEAEBAAAAAAAABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAD///8BAAAABQAAABEAAAAJAAAAAwAAAAMAAAAD////Af///wH///8B////Af///wH///8B////Af///wH///8B////AQAAAAcAAAAVLyoiXzcxJa09NijfPjcp4YiHhcWbm5ypioqLhWtrbF8vLy85AAAAIQAAAAP///8B////AXt7fBGFhYZHiomLRXFua0FEPzNPOjMkY1dSSceqqqr/vLy9/7a2t/+vr7D/kZGS4wAAABkAAAAbAAAAFf///wGXlZKPq6qg57GtlK2vqIqjsaySt6+qlcOvr5/1t7es/76+t//GxsT/zMzM98fIyIW8vLxDwcHBKY6Njg////8BioZ8j5aTjpkUERGjHRIS4SIVFM8oGRa9Mh8ZrUc0KatfTT2tdWROsYZ1XauciHGVt6aQl7uwnp/GxLPRuLi2gYyIfo+XlJCZCQgIzQAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8IBgX/Eg8O5bOwpXuOi4CPmZaSmQgIB80AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wICAfGqqKB3kY2Cj5yZlJkIBwfNAAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8FBATtpaKcd5SQhY+em5eZCAcHzQAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wUFBf8aGhr/Li0s65+dl3WXk4iPop+amQgHB80AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AQEB/xISEv8mJib/MjIy/zk3NumamJJ1m5eMj6WinZkHBwfPXV1d/wcHB/9PT0//V1dX/0tLS/8AAAD/BQUF/xkZGf8nJyf/MjIy/zw8PP9CPz3nlJKNdZ+bj5GopZ+ZBwcHz25ubv+qqqr/ODg4/zg4OP8pKSn/CAgI/xwcHP8oKCj/MzMz/zw8PP9DQ0P/SENB55COiXOin5KRq6iimQcHBs9gYGD/m5ub/wAAAP8AAAD/DQ0N/x0dHf8oKCj/MzMz/z09Pf9DQ0P/R0dH/0pFQ+WMioVzpaGUkaunoZ8ICAjPc3Nz/wcHB/0GBgb1FBMT7x4eHecqKSfhNTMx3T89OttIRUHZT0xH2VVSTNtwbWTflZOQibKwrYe4tanplpGCs4uDcamblIOto52Ot6Gcj7+fmo69nZmNs5qWi6mVkombjoyFjYaFgH9/f3xxfXx9Y3t8fi+npqYbsbKyU7m4uE2/v787srKxKY+OjxdtbW0H////Af///wH///8B////Af///wH///8B////Af///wH///8B//8AAPA/AAD8DwAAAA8AAAAAAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAAAAAAADwAA//8AAA=="
};