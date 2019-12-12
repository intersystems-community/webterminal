/// <!-- @echo package.title --> version <!-- @echo package.version --> WebSocket client.
/// This class represents a connected client via WebSocket.
Class WebTerminal.Engine Extends (%CSP.WebSocket, Common, Trace, Autocomplete)
{

/// Timeout in minutes when connection key expires.
Parameter WSKEYEXPIRES = 3600;

/// How long to wait for authorization key when connection established
Parameter AuthorizationTimeout = 5;

Property CurrentNamespace As %String;

Property InitialZName As %String;

Property InitialZNamespace As %String;

/// The process ID of the terminal core.
Property corePID As %Numeric [ InitialExpression = 0 ];

/// The last known namespace in child process.
Property childNamespace As %String;

Property StartupRoutine As %String;

/// Output flag
Property echo As %Boolean [ InitialExpression = 1 ];

/// flag which enables output buffering
Property bufferOutput As %Boolean [ InitialExpression = 0 ];

/// Used to buffer the output ("o" flag) when bufferOutput flag is set
Property outputBuffer As %Stream.TmpCharacter [ InitialExpression = {##class(%Stream.TmpCharacter).%New()} ];

/// Output flag
Property handler As %Boolean [ InitialExpression = 0, Private ];

Method GetMessage(timeout As %Integer = 86400) As %ZEN.proxyObject
{
    #define err(%e, %s) if (%e '= $$$OK) { set obj = ##class(%ZEN.proxyObject).%New() set obj.error = %s return obj }
    set data = ..Read(, .st, timeout)
    return:((st = $$$CSPWebSocketTimeout) || (st = $$$CSPWebSocketClosed)) ""
    $$$err(st, "%wsReadErr: "_$System.Status.GetErrorText(st))
    set st = ##class(%ZEN.Auxiliary.jsonProvider).%ConvertJSONToObject(data, , .obj, 1)
    $$$err(st, "%wsParseErr: "_$System.Status.GetErrorText(st))
    return obj
}

/// Do not remove this method in future versions of WebTerminal, it is used by update.
Method Send(handler As %String = "", data = "") As %Status
{
    if (handler = "o") && (..bufferOutput = 1) {
        do ..outputBuffer.Write(data)
        return $$$OK
    }
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

/// This method performs the authorization and login to WebTerminal.
/// It returns a list with data (see Router.Auth method), which is used then to set up the
/// initial values for the client.
Method RequireAuthorization() As %List
{
    set data = ..GetMessage(..#AuthorizationTimeout)
    return:(data = "") $LB("%wsReadErr")
    return:('$IsObject(data.d)) $LB($case(data.error = "", 1: "Unresolved WS message format", :data.error))
    return:(data.d.key = "") $LB("Missing key")

    set authKey = data.d.key
    set key = $ORDER(^WebTerminal("AuthUser", ""))
    set list = ""
    while (key '= "") {
        set lb = $GET(^WebTerminal("AuthUser", key))
        if ((lb '= "") && (key = authKey)) {
            set list = lb
        }
        set time = $LISTGET(lb, 2)
        if (time '= "") && ($System.SQL.DATEDIFF("s", time, $h) > ..#WSKEYEXPIRES) {
            kill ^WebTerminal("AuthUser", key)
        }
        set key = $ORDER(^WebTerminal("AuthUser", key))
    }

    if (list = "") { // not found
        return $LB("Invalid key")
    }

    set username = $LISTGET(list, 1)
    set namespace = $LISTGET(list, 3)
    set ns = $Namespace

    znspace "%SYS"
    do ##class(Security.Users).Get(username, .userProps)
    znspace ns

    set namespace = $case(namespace, "":userProps("NameSpace"), :namespace)

    if ($get(userProps("Routine")) '= "") {
        set ..StartupRoutine = userProps("Routine")
    }

    if $get(userProps("Enabled")) '= 1 {
        return $LB("User " _ username _ " is not enabled in the system")
    }

    set $LIST(list, 3) = namespace
    set loginStatus = $System.Security.Login(username)

    if (loginStatus '= 1) {
        return $LB($System.Status.GetErrorText(loginStatus))
    }

    return $LB("", list)
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
    job ##class(WebTerminal.Core).Loop(..StartupRoutine):($NAMESPACE):5
    if ($TEST '= 1) { // $TEST=0 for JOB only when timeouted
        do ..Send("error", "%noJob")
        return $$$NOTOK
    }
    set ..corePID = $ZCHILD
    set ..childNamespace = $NAMESPACE
    if (..StartupRoutine = "") {
        do ..Send("prompt", ..childNamespace)
    } else {
        set message = ##class(%ZEN.proxyObject).%New()
        set status = $CLASSMETHOD("WebTerminal.Handlers", "Execute", $this, "", 1)
        goto loopEnd
    }
    //try { // temp
    for {
        set message = ..GetMessage()
        quit:(message = "") // if client is gone, finish looping
        if (message.error) {
            set st = ..Send("error", message.error)
            quit
        }
        if (message."_cb" '= "") { set ..handler = message."_cb" }
        set status = ..ProcessRequest(message.h, message.d)
        set ..handler = 0
        set ..echo = 1
        if (status '= "") && (status '= $$$OK) {
            set eType = $EXTRACT(status, 1, 1)
            do ..Send("oLocalized", $C(13,10) _ $case(eType = 0, 1: $System.Status.GetErrorText(status), :status))
            continue
        }
    }
loopEnd
    //} catch (e) {  do ..Send("o", $System.Status.GetErrorText(e)) } // temp
    return $$$OK
}

/// This method sends basic login info to the user. Use this method to set client variables
/// during the WebTerminal initialization.
/// <parameter>authList</parameter> See Router.Auth method.
Method SendLoginInfo(authList As %List)
{
    set obj = ##class(%ZEN.proxyObject).%New()
    set obj.username = $USERNAME
    set obj.name = $get(^WebTerminal("Name"))
    set obj.cleanStart = $ListGet(authList, 4)
    set obj.system = $SYSTEM
    set obj.firstLaunch = ($get(^WebTerminal("FirstLaunch"), 1) '= 0)
    set obj.InstanceGUID = ##class(%SYS.System).InstanceGUID()
    set obj.zv = $ZVersion
    set ^WebTerminal("FirstLaunch") = 0
    do ..Send("init", obj)
}

/// Triggered when new connection established.
Method Server() As %Status
{
    set authRes = ..RequireAuthorization()
    set authMessage = $ListGet(authRes, 1)
    if (authMessage = "") {
        set authList = $ListGet(authRes, 2) // see Router.Auth method
        set namespace = $ListGet(authList, 3)
        if (namespace '= "") && (namespace '= $Namespace) {
            try {
                znspace namespace
            } catch (e) {
                do ..Send("oLocalized",
                    $Char(27) _ "[31m%unNS(" _ namespace _ ")"_ $Char(27) _ "[0m" _ $Char(13,10)
                )
            }
        }
        set ..CurrentNamespace = $Namespace
        do ..SendLoginInfo(authList)
        do ..ClientLoop()
        do ..Send("oLocalized", "%wsNormalClose"_$C(13,10))
    } else {
        do ..Send("oLocalized", "%wsRefuse(" _ authMessage _ ")")
    }
    do ..EndServer()
    quit $$$OK
}

}
