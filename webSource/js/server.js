var server = new function() {

    var socket = null, // webSocket object
        serverRoot = "%WebTerminal.Engine.cls", // name of Cache class
        LOG_DATA = true;

    var logData = function(direction,string) {
        log.write(
            "DATA " + ((direction)?"to":"from") + " server: (" + ((string)?string.charCodeAt(0):"empty") + ") ",string
        );
    };

    /**
     * Shows if client currently connected to server.
     *
     * @returns {boolean|string}
     *  If connected, returns server ws URL.
     */
    this.connected = function() {
        return (socket == null)?false:socket.url;
    };

    /**
     * Disconnect from server.
     */
    this.disconnect = function() {
        terminal.watches.stopAll();
        if (server.connected()) {
            terminal.output.write(lang.get(36));
            socket.close();
            socket = null;
            terminal.namespace.set(lang.get(4));
        } else terminal.output.write(lang.get(37))
    };

    /**
     * Requests autocomplete for namespace.
     *
     * @param namespace
     */
    this.requestAutocompleteFile = function(namespace) {
        terminal.output.write(lang.get(38) + " " + namespace.replace(/_/g,"%"));
        ajax.get("js/autocomplete/" + namespace + ".js",function(data,allRight){
            namespace = namespace.replace(/_/g,"%");
            if (allRight) {
                var obj = parser.jsonToObject(data);
                if (!obj.hasOwnProperty("class")) {
                    terminal.output.write(lang.get(39) + " " + namespace + ".");
                } else {
                    if (obj.hasOwnProperty("class")) terminal.language.addClasses(obj.class);
                    if (obj.hasOwnProperty("global")) terminal.language.addGlobals(obj.global);
                    terminal.output.write(lang.get(40) + " " + namespace + " " + lang.get(41));
                }
            } else {
                terminal.output.write(lang.get(40) + namespace + " " + lang.get(42));
            }
        });
    };

    /**
     * Return default webSocket URL to connect on current domain.
     *
     * @returns {string}
     */
    this.getDefaultServerURL = function() {
        var part = document.URL.split("/")[2]; // domain[:port]

        if (application.debug) part = application.debugUrlPart;

        return "ws://" + part + "/" + serverRoot.replace(/%/,"%25");
    };

    /**
     * Connect to server. If url isn't passed, it will be generated from current expecting the same domain.
     * E.g. "http://localhost:81/..." will become "ws://localhost:81/<serverRoot>"
     *
     * [ @param url ]
     *  WebSocket server core URL starting with "ws://"
     * @returns {boolean}
     */
    this.connect = function(url) {

        if (this.connected()) {
            terminal.output.write(lang.get(43));
            return false;
        }
        if (typeof url == "undefined" || typeof url != "string" || !url) { url = this.getDefaultServerURL() }
        socket = new WebSocket(url);
        socket.onopen = onOpen;
        socket.onclose = onClose;
        socket.onmessage = onMessage;
        socket.onerror = onError;
        return true;

    };

    /**
     * Submits clear data to server. Default terminator: true.
     * Data will be trimmed and \n'd if terminator true
     *
     * @param action
     * [ @param data ]
     * [ @param terminator ]
     */
    this.submit = function(action,data,terminator) {
        if (typeof terminator == "undefined") terminator = true;
        if (!data) data = "";
        data = data.trim().replace(/\r\n|\r|\n/g,"\n") + ((terminator)?"\n":"");
        if (socket) {
            socket.send((action || "") + data);
        } else {
            terminal.output.write(lang.get(44))
        }
    };

    this.send = function(data) {
        if (LOG_DATA) logData(1,data);
        if (!this.connected()) { log.write("Unable to send data to server: no connection established.") }
        socket.send(data);
    };

    var onOpen = function() {
        if (application.authorizationKey) server.send(application.authorizationKey);
    };

    var onClose = function(a) {
        terminal.output.write(lang.get(45) + " " + a.code + " " + a.reason);
    };

    var onMessage = function(event) {
        if (LOG_DATA) logData(0,event.data);
        terminal.handlers.serverMessage(event.data);
    };

    var onError = function(error) {
        terminal.output.write(lang.get(46) + " ",error)
    };

};

var ajax = new function() {

    function getXmlHttp() {
        var xmlhttp;
        try {
            xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
        } catch (e) {
            try {
                xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
            } catch (E) {
                xmlhttp = false;
            }
        }
        if (!xmlhttp && typeof XMLHttpRequest!='undefined') {
            xmlhttp = new XMLHttpRequest();
        }
        return xmlhttp;
    }

    /**
     * Gets data from server and handles it with handler.
     *
     * @param url
     * @param handler
     * [ @param caching ]
     */
    this.get = function(url, handler, caching) {

        if (typeof caching === "undefined") caching = false;
        var req = getXmlHttp();
        caching = "cache=" + ((caching)?1:new Date().getTime());

        req.onreadystatechange = function() {

            if (req.readyState == 4) { //req.statusText

                if(req.status == 200) {
                    handler.call(null,req.responseText,1);
                } else {
                    handler.call(null,null,0);
                    log.write("Ajax GET error: ",req.statusText,req.responseText);
                }

            }

        };

        var s = (url.indexOf("?") === -1)?"?":"&";

        req.open("GET", url + s + caching, true);
        req.send(null);

    }

};