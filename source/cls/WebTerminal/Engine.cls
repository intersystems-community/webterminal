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

Method Send(handler As %String, data = "") As %Status
{
    set obj = ##class(%ZEN.proxyObject).%New()
    set obj.h = handler
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

Method Update(version) As %Status
{
    set httprequest = ##class(%Net.HttpRequest).%New()
    set httprequest.Server = "intersystems-ru.github.io"
    do ..SendData("34", ..#ClientOutputLocalized)
    do ..SendData(" http://intersystems-ru.github.io/webterminal/files/" _ version _ ".xml ")
    do httprequest.Get("/webterminal/files/" _ version _ ".xml")
    if (httprequest.HttpResponse.StatusCode '= 200) {
        do ..SendData($C(27)_"[31mFAIL" _ $C(27) _ "[0m (status code "
            _ httprequest.HttpResponse.StatusCode _ ")" _ $C(13,10))
        quit $$$NOTOK
    }
    do ..SendData($C(27)_"[32mOK" _ $C(27) _ "[0m")
    if ($isobject(httprequest.HttpResponse.Data)) {
        do ..SendData($C(13,10))
        do ..SendData("35", ..#ClientOutputLocalized)
        do ..SendData($C(13,10))
        do ..SendData("Moving back to terminal's home namespace " _ ..InitialZNamespace _ "...")
        zn ..InitialZNamespace
        //do ..StartClearIO()
        set stload = $System.OBJ.LoadStream(httprequest.HttpResponse.Data, "", .error, .items)
        if $$$ISERR(stload) {
            w $C(27)_"[31mFAILED" _ $C(27) _ "[0m " _ $System.Status.GetErrorText(stload)
            quit $$$NOTOK
        }
        set logFileName = ##class(%File).SubDirectoryName(##class(%File).ManagerDirectory(),"CWTUpdateLog.txt")
        open logFileName:("NRW"):5
        set io = $IO
        use logFileName
        set st2 = $System.OBJ.CompileList(.items, "cuk /checkuptodate=none")
        close logFileName
        use io
        if $$$ISERR(st2) { write $System.Status.GetErrorText(st2) quit $$$NOTOK }
        //do ..EndClearIO()
        if ##class(%File).Exists(logFileName) {
            set stream = ##class(%Stream.FileCharacter).%New()
            set sc = stream.LinkToFile(logFileName)
            while 'stream.AtEnd {
                set line = stream.Read()
                do ..SendData(line)
            }
            do ##class(%File).Delete(logFileName)
        }
    }
    quit $$$OK
}

Method CheckUpdate() As %Status
{
    set httprequest = ##class(%Net.HttpRequest).%New()
    set httprequest.Server = "intersystems-ru.github.io"
    do httprequest.Get("/webterminal/latestVersion")
    if (httprequest.HttpResponse.StatusCode '= 200) {
        do ..SendData($C(27)_"[31mFAIL" _ $C(27) _ "[0m (status code "
            _ httprequest.HttpResponse.StatusCode _ ")" _ $C(13,10))
        quit $$$NOTOK
    }
    if ($isobject(httprequest.HttpResponse.Data)) {
        do ..SendData(httprequest.HttpResponse.Data.Read(), ..#ClientPromptUpdate)
    }
    quit $$$OK
}

/// This method holds process and expects only one package from
/// the client - it includes authorization key.
Method RequireAuthorization() As %Status
{
    set data = ..GetMessage(..#AuthorizationTimeout)
    set ^data = data
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

/// Main method for every new client.
Method ClientLoop() As %Status
{
    job ##class(WebTerminal.Core).Loop():($NAMESPACE)
    if ($TEST '= 1) {
        do ..Send("error", "%noJob")
        return 0
    }
    set ..corePID = $ZCHILD
    set ..childNamespace = $NAMESPACE
    do ..Send("prompt", ..childNamespace)
    // set ^test = $JOB _ "->" _ $ZCHILD
    // try {
    for {

        set message = ..GetMessage()
        quit:(message = "") // if client is gone, finish looping
        set data = message.d
        set handler = message.h

        if (handler = "execute") {
            do ..Send("o", $CHAR(13, 10))
            do ..SendChunk(..corePID, "m", message.d)
            for {
                set message = ..ReceiveChunk()
                set flag = $LISTGET(message, 1)
                set data = $LISTGET(message, 2)
                if (flag = "o") {
                    do ..Send("o", data)
                } elseif (flag = "r") {
                    set obj = ##class(%ZEN.proxyObject).%New()
                    set obj.length = $LISTGET(data, 1)
                    set obj.timeout = $LISTGET(data, 2)
                    do ..Send("readString", obj)
                    do ..SendChunk(..corePID, "m", ..GetMessage().d)
                } elseif (flag = "c") {
                    set obj = ##class(%ZEN.proxyObject).%New()
                    set obj.timeout = data
                    do ..Send("readChar", obj)
                    do ..SendChunk(..corePID, "m", ..GetMessage().d)
                } elseif (flag = "e") {
                    set ..childNamespace = $LISTGET(data, 1)
                    set err = $LISTGET(data, 2)
                    if (err '= "") {
                        do ..Send("execError", err)
                    }
                    quit // break for cycle
                } else { // unknown response - just send it to the client
                    do ..Send("o", data)
                }
            }
            do ..Send("o", $CHAR(13, 10))
            do ..Send("prompt", ..childNamespace)
        } else { // error or unknown message
            quit
        }

    }
    // } catch (e) { set ^err = $ZERROR }
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
