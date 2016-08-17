/// <!-- @echo package.title --> version <!-- @echo package.version --> WebSocket client.
/// This class represents a connected client via WebSocket.
Class WebTerminal.Engine Extends (%CSP.WebSocket, Common, Trace, Autocomplete)
{

Property CurrentNamespace As %String;

Property InitialZName As %String;

Property InitialZNamespace As %String;

/// The process ID of the terminal core.
Property corePID As %Numeric [ InitialExpression = 0 ];

/// The last known namespace in child process.
Property childNamespace As %String;

/// Output flag
Property echo As %Boolean [ InitialExpression = 1 ];

/// Output flag
Property handler As %Boolean [ InitialExpression = 0, Private ];

Method GetMessage(timeout As %Numeric) As %ZEN.proxyObject
{
    #define err(%e, %s) if (%e '= $$$OK) { set obj = ##class(%ZEN.proxyObject).%New() set obj.error = %s return obj }
    set data = ..Read()
    set st = 1
    $$$err(st, "WebSocket read error")
    set st = ##class(%ZEN.Auxiliary.jsonProvider).%ConvertJSONToObject(data, , .obj, 1)
    $$$err(st, "WebSocket message parse error")
    return obj
}

Method Send(handler As %String = "", data = "") As %Status
{
    return:((handler = "o") && (..echo = 0)) $$$OK
    return:(handler = "o") ..Write("o"_data) // Enables 2013.2 support (no JSON)
    set obj = ##class(%ZEN.proxyObject).%New()
    set obj.h = handler
    if (..handler '= 0) {
        set obj."_cb" = ..handler
    }
    set obj.d = data
    return ..Write(..GetJSONString(obj))
}

Method OnPreServer() As %Status
{
    set ..InitialZName = $zname
    set ..InitialZNamespace = $znspace
    quit $$$OK
}

Method OnPostServer() As %Status
{
    if (..corePID '= 0) {
        do ..SendChunk(..corePID, "e")
    }
    kill ^CacheTemp.WebTerminal.Watching // @deprecated
    quit $$$OK
}

ClassMethod WriteToFile(filename As %String, data As %String) As %Status
{
    set file=##class(%File).%New(filename)
    do file.Open("WSN")
    do file.WriteLine(data)
    do file.Close()
}

Method ExecuteSQL(query As %String = "") As %Status
{
    set tStatement = ##class(%SQL.Statement).%New()
    set qStatus = tStatement.%Prepare(query)
    if qStatus'=1 {
        write $System.Status.DisplayError(qStatus)
    } else {
        set rset = tStatement.%Execute()
        do rset.%Display()
    }
    quit $$$OK
}

/// This method transforms error 
ClassMethod ParseError(string As %String) As %String
{
    set string = $REPLACE($REPLACE(string, ">", "<"), ".Engine.", "<")
    quit "ERROR: " _ $PIECE(string, "<", 2) _
        $EXTRACT($PIECE(string, "<", 4), 2, *)
}

/// This method holds process and expects only one package from
/// the client - it includes authorization key.
Method RequireAuthorization() As %Status
{
    set data = ..GetMessage(..#AuthorizationTimeout)
    return:(data.d = "") $$$NOTOK
    set authKey = data.d
    set ok = $$$NOTOK

    set namespace = ""
    set pos = $FIND(authKey, "#")
    if pos '= 0 {
        set namespace = $EXTRACT(authKey, pos, *)
        set authKey = $EXTRACT(authKey, 1, pos-2)
    }

    /*
     * Find given CSPSessionCookie in WebTerminal auth global. If found, grant access.
     */
    SET key = $ORDER(^WebTerminal("AuthUser", ""))
    WHILE (key '= "") {
        set lb = $GET(^WebTerminal("AuthUser", key))
        if ((lb '= "") && (key = authKey)) {

            // setup privileges
            set username = $LISTGET(lb, 1) // user name
            set ns = $namespace
            zn "%SYS"
            do ##class(Security.Users).Get(username, .userProps)
            zn ns
            continue:($order(userProps("")) = "")

            set namespace = $case(namespace, "":userProps("NameSpace"), :namespace)
            set loginStatus = $System.Security.Login(username) // login user

            kill ^WebTerminal("AuthUser", key)

            set ok = loginStatus

        }

        // kill "old" auth tickets
        set time = $LISTGET(lb, 2)
        if (time '= "") && ($System.SQL.DATEDIFF("s", time, $h) > 100) { // if older than 100 sec
            kill ^WebTerminal("AuthUser", key)
        }

        SET key = $ORDER(^WebTerminal("AuthUser", key))
    }

    if (namespace '= "") {
        try { // in case user may specify namespace that does not exists
            znspace namespace
        } catch (e) {  }
    }

    quit ok
}

/// See WebTerminal.Handlers
Method ProcessRequest(handler As %String, data) As %Status [ Private ]
{
    try {
        return $CLASSMETHOD("WebTerminal.Handlers", handler, $this, data)
    } catch (e) {
        set ..echo = 1
        return e.AsSystemError()
    }
}

/// Main method for every new client.
Method ClientLoop() As %Status [ Private ]
{
    job ##class(WebTerminal.Core).Loop():($NAMESPACE)
    if ($TEST '= 1) {
        do ..Send("error", "%noJob")
        return $$$NOTOK
    }
    set ..corePID = $ZCHILD
    set ..childNamespace = $NAMESPACE
    do ..Send("prompt", ..childNamespace)
    //try { // temp
    for {
        set message = ..GetMessage()
        quit:(message = "") // if client is gone, finish looping
        if (message."_cb" '= "") { set ..handler = message."_cb" }
        set status = ..ProcessRequest(message.h, message.d)
        set ..handler = 0
        set ..echo = 1
        if (status '= "") && (status '= $$$OK) {
            set eType = $EXTRACT(status, 1, 1)
            do ..Send("execError", $case(eType = 0, 1: $System.Status.GetErrorText(status), :status))
            continue
        }
    }
    //} catch (e) {  do ..Send("o", $System.Status.GetErrorText(e)) } // temp
}

/// This method sends basic login info to the user. Use this method to set client variables
/// during the WebTerminal initialization.
Method SendLoginInfo()
{
    set obj = ##class(%ZEN.proxyObject).%New()
    set obj.username = $USERNAME
    set obj.name = $get(^WebTerminal("Name"))
    set obj.system = $SYSTEM
    do ..Send("init", obj)
}

/// Triggered when new connection established.
Method Server() As %Status
{
    if ($$$ISOK(..RequireAuthorization())) {
        set ..CurrentNamespace = $Znspace
        do ..SendLoginInfo()
        do ..ClientLoop()
    } else {
        do ..EndServer()
    }

    quit $$$OK
}

}
