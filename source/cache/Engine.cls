/// Cache WEB Terminal version 3.3.1 core.
/// This class is the server-side core of the terminal application.
Class WebTerminal.Engine Extends (%CSP.WebSocket, Trace, Autocomplete) [ DependsOn = Common ]
{

/// This property determines whether the communication between the client and WebSocket server should be over a dedicated Gateway
/// connection or over a pool of shared connections.  It may be set to one of the following:
/// <br><ul>
/// <li><b>SharedConnection=0</b> - The WebSocket server communicates with the client via a dedicated Gateway connection. In this mode of operation the hosting connection is effectively 'private' to the application session.</li>
/// <li><b>SharedConnection=1</b> - The WebSocket server communicates asynchronously with the client via a fixed number of shared Gateway connections.</li>
/// </ul>
Property SharedConnection As %Boolean [ InitialExpression = 0 ];

Property CurrentNamespace As %String;

Property InitialZName As %String;

Property InitialZNamespace As %String;

/// Public point entries, using when redirecting i/o
Method redirects() [ Private, ProcedureBlock = 0 ]
{
/// Mnemonics
APC d APC^%X364 q
BEL d BEL^%X364 q
CBT(%1) d CBT^%X364(%1) q
CCH d CCH^%X364 q
CHA(%1) d CHA^%X364(%1) q
CHT(%1) d CHT^%X364(%1) q
CNL(%1) d CNL^%X364(%1) q
CPL(%1) d CPL^%X364(%1) q
CPR d CPR^%X364 q
CTC(%1,%2,%3,%4,%5,%6,%7,%8,%9) d CTC^%X364(%1,%2,%3,%4,%5,%6,%7,%8,%9) q
CUB(%1) d CUB^%X364(%1) q
CUD(%1) d CUD^%X364(%1) q
CUF(%1) d CUF^%X364(%1) q
CUP(%2,%1) d CUP^%X364(%2,%1) q
CUU(%1) d CUU^%X364(%1) q
CVT(%1) d CVT^%X364(%1) q
DA d DA^%X364 q
DAQ(%1,%2,%3,%4,%5,%6,%7,%8,%9) d DAQ^%X364(%1,%2,%3,%4,%5,%6,%7,%8,%9) q
DCH(%1) d DCH^%X364(%1) q
DCS d DCS^%X364 q
DL(%1) d DL^%X364(%1) q
DMI d DMI^%X364 q
DSR(%1) d DSR^%X364(%1) q
EA(%1) d EA^%X364(%1) q
ECH(%1) d ECH^%X364(%1) q
ED(%1) d ED^%X364(%1) q
EF(%1) d EF^%X364(%1) q
EL(%1) d EL^%X364(%1) q
EMI d EMI^%X364 q
EPA d EPA^%X364 q
ESA d ESA^%X364 q
FNT d DNT^%X364 q
GSM d GSM^%X364 q
GSS d GSS^%X364 q
HPA(%1) d HPA^%X364(%1) q
HPR(%1) d HPR^%X364(%1) q
HTJ d HTJ^%X364 q
HTS d HTS^%X364 q
HVP(%1,%2) d HVP^%X364(%1,%2) q
ICH(%1) d ICH^%X364(%1) q
IL(%1) d IL^%X364(%1) q
IND d IND^%X364 q
INT d INT^%X364 q
JFY d JFY^%X364 q
MC d MC^%X364 q
MW d MW^%X364 q
NEL d NEL^%X364 q
NP(%1) d NP^%X364(%1) q
OSC d OSC^%X364 q
PLD d PLD^%X364 q
PLU d PLU^%X364 q
PM d PM^%X364 q
PP(%1) d PP^%X364(%1) q
PU1 d PU1^%X364 q
PU2 d PU2^%X364 q
QUAD d QUAD^%X364 q
REP d REP^%X364 q
RI d RI^%X364 q
RIS d RIS^%X364 q
RM(%1,%2,%3,%4,%5,%6,%7,%8,%9) d RM^%X364(%1,%2,%3,%4,%5,%6,%7,%8,%9) q
SEM d SEM^%X364 q
SGR(%1,%2,%3,%4,%5,%6,%7,%8,%9) d SGR^%X364(%1,%2,%3,%4,%5,%6,%7,%8,%9) q
SL d SL^%X364 q
SM(%1,%2,%3,%4,%5,%6,%7,%8,%9) d SM^%X364(%1,%2,%3,%4,%5,%6,%7,%8,%9) q
SPA d SPA^%X364 q
SPI d SPI^%X364 q
SR d SR^%X364 q
SS2 d SS2^%X364 q
SS3 d SS3^%X364 q
SSA d SSA^%X364 q
ST d ST^%X364 q
STS d STS^%X364 q
SU d SU^%X364 q
TBC d TBC^%X364 q
TSS d TSS^%X364 q
VPA(%1) d VPA^%X364(%1) q
VPR(%1) d VPR^%X364(%1) q
VTS d VTS^%X364 q

PrepareOutput(data)
    Try { Set data=$zconvert(data, "O", "UTF8") } Catch {  }
    quit data

PrepareInput(data)
    Try { Set data=$zconvert(data, "I", "UTF8") } Catch {  }
    quit data

/// Routine from %CSP.WebSocket.cls
ReadMessage(len = 32656, timeout = 86400, BytesAvailable, AtEnd, data, data1, header, size, type)
    Set $ZTrap="ReadError"
    If len<1 Set len=32656
    //If (..SharedConnection = 1) {
    //    Set data=..ReadAsync(.len, .sc, timeout)
    //    Try { Set data1=$zconvert(data,"I","UTF8") } Catch { Set data1=data }
    //    Set len=$Length(data1)
    //    Quit data1
    //}
    Set BytesAvailable=0, AtEnd=0
    Read header#5:timeout
    If $Test=0 {
        Set len=0
        //Set sc=$$$ERROR($$$CSPWebSocketTimeout, "WebSocket Read Operation timed-out")
        Set AtEnd=1
        Quit ""
    }
    Set type=$Extract(header,5)
    If type=9 {
        Set len=0
        //Set sc=$$$ERROR($$$CSPWebSocketClosed,"WebSocket Closed by the Client")
        Set AtEnd=1
        Quit ""
    }
    Set header=$Extract(header, 1, 4)
    Set size=$ZLA(header)-1 If size<0 Set size=0
    Set BytesAvailable=size
ReadData
    If BytesAvailable > len {
        Set size=len
        Set BytesAvailable=BytesAvailable-len
    }
    else {
        Set size=BytesAvailable
        Set BytesAvailable=0
    }
    If 'BytesAvailable Set AtEnd=1
    If size=0 Set len=0 Quit ""
    Read data#size
    Set len=size
    //Set sc=$$$OK
    Try { Set data1=$zconvert(data,"I","UTF8") } Catch { Set data1=data }
    Set len=$Length(data1)
    Quit data1
ReadError
    #; No interrupts during cleanup or error processing
    $$$SetExternalInterrupts(0)
    Set $ZTrap="ReadHalt"
    Hang 5
    Close 0
ReadHalt
    Halt

/// Workaround for Cache 2015
#define WSProtocol (##class(%Dictionary.CompiledProperty).%OpenId("%CSP.WebSocket||WSClassProtocolVersion"))
WriteMessage(data, data1, head)
    if ($$$WSProtocol) && ($$$WSProtocol.InitialExpression > 1) {
        try { set data1 = $zconvert(data, "O", "UTF8") } catch { set data1 = data }
        set head = $ZLChar($Length(data1))
        set head = head _ "7"
        write head _ data1, *-3
    } else {
        write $$PrepareOutput(data), *-3
    }
    quit

//////////////////////////////////////////////

wstr(s)
    do ##class(%Device).ReDirectIO($$$NO)
    do WriteMessage("O#"_s)
    do ##class(%Device).ReDirectIO($$$YES)
    set $X = $X + $LENGTH(s)
    set $Y = $Y - 1
    quit

wchr(c)
    do ##class(%Device).ReDirectIO($$$NO)
    do WriteMessage("O#"_$c(c))
    do ##class(%Device).ReDirectIO($$$YES)
    set $X = $X + 1
    set $Y = $Y - 1
    quit

wnl
    do ##class(%Device).ReDirectIO($$$NO)
    do WriteMessage("O#"_$c(13, 10))
    do ##class(%Device).ReDirectIO($$$YES)
    set $X = 0
    quit

wff
    do ##class(%Device).ReDirectIO($$$NO)
    do WriteMessage("CLRSCR#")
    do ##class(%Device).ReDirectIO($$$YES)
    set $Y = 0
    set $X = 0
    quit

wtab(s)
    do ##class(%Device).ReDirectIO($$$NO)
    do WriteMessage("O#" _ $C(27) _ "[" _ (s + 1) _ "G")
    do ##class(%Device).ReDirectIO($$$YES)
    set $X = s
    quit

rstr(len = 32656, timeout = 86400, data)
    do ##class(%Device).ReDirectIO($$$NO)
    do WriteMessage("R#" _ len)
    s data = $$ReadMessage(len, timeout)
    do ##class(%Device).ReDirectIO($$$YES)
    quit data

rchr(timeout = 86400, data)
    do ##class(%Device).ReDirectIO($$$NO)
    do WriteMessage("RC#")
    set data = $$ReadMessage(, timeout)
    set data = data * 1 // $ASCII($EXTRACT(data,1,1))
    do ##class(%Device).ReDirectIO($$$YES)
    quit data
}

Method OnPreServer() As %Status
{
    set ..InitialZName = $zname
    set ..InitialZNamespace = $znspace
    quit $$$OK
}

Method OnPostServer() As %Status
{
    kill ^CacheTemp.WebTerminal.Watching
    quit $$$OK
}

ClassMethod WriteToFile(filename As %String, data As %String) As %Status
{
    set file=##class(%File).%New(filename)
    do file.Open("WSN")
    do file.WriteLine(data)
    do file.Close()
}

/// Function sends data derectly to server with specified action
Method SendData(query As %String = "", action As %String = "") As %Status
{
    if (action = "") { set action = ..#ClientOutputMessage }
    do ..Write(action _ query)
}

Method ExecuteSQL(query As %String = "") As %Status
{
    do ..StartClearIO()
    do ##class(%Device).ReDirectIO($$$YES)

    set tStatement = ##class(%SQL.Statement).%New()
    set qStatus = tStatement.%Prepare(query)
    if qStatus'=1 {
        write $System.Status.DisplayError(qStatus)
    } else {
        set rset = tStatement.%Execute()
        do rset.%Display()
    }

    do ##class(%Device).ReDirectIO($$$NO)
    do ..EndClearIO()

    quit $$$OK
}

/// Sends to client new namespace if last was changed
Method ClientAlertNamespace()
{
    if (..CurrentNamespace '= $Znspace) { // change client namespace
        set ..CurrentNamespace = $Znspace
        do ..SendData(..CurrentNamespace,..#ClientChangeNamespace)
    }
}

/// Starts clear I/O mode
Method StartClearIO()
{
    write *-3
    do ..Write(..#ClientStartExec)
    write *-3
    do ##class(%Device).ReDirectIO($$$YES)
}

/// Ends clear I/O mode
Method EndClearIO()
{
    //write *-3
    do ##class(%Device).ReDirectIO($$$NO)
    do ..SendData("",..#ClientEndExec)
    write *-3
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
        do ..StartClearIO()
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
        do ..EndClearIO()
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

/// The heart of terminal application
Method ExecuteCommand(query As %String = "") As %Status
{
    if (query = "") quit $$$OK

    #dim exception as %Exception.AbstractException
    set value = $Replace(query, $CHAR(10), " ")

    do ..StartClearIO() // execute session start

    set $ZERROR = ""

    try { xecute value } catch exception {
        set $ZERROR = exception.DisplayString()
    }

    if ($ZERROR '= "") {
        w $ZERROR, *-3
    }

    do ..EndClearIO() // execute session end
    do ..ClientAlertNamespace() // check namespace change

    quit $$$OK
}

/// This method holds process and expects only one package from
/// the client - it includes authorization key.
Method RequireAuthorization() As %Status
{
    set authKey = ..Read(, .status, ..#AuthorizationTimeout) // wait for package
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

    kill // clear junk vars

    do ..SendData($NAMESPACE, ..#ClientPrompt)

    for {

        set data = ..Read(,.status)

        if $$$ISERR(status) {

            try {
                do ..SendData("40", ..#ClientOutputLocalized)
            } catch e { }
            quit:($$$GETERRORCODE(status)=$$$CSPWebSocketClosed)

        }

        set pos = $FIND(data, "#")
        set action = $EXTRACT(data, 1, pos-2)
        set data = $EXTRACT(data, pos, *)

        if (action = ..#ServerActionExecute) {

            do ..ExecuteCommand(data)
            do ..SendData($NAMESPACE, ..#ClientPrompt)

        } elseif (action = ..#ServerActionCheckTrace) {

            set changes = ..CheckTracing()
            if (changes '= "") {
                do ..SendData(changes)
            }

        } elseif (action = ..#ServerActionTrace) { // add/remove

            set result = ..Trace(data)
            if ('$$$ISOK(result)) {
                set result = ..StopTracing(data)
                if ('$$$ISOK(result)) {
                    do ..SendData("!" _ data, ..#ClientTrace)
                }
            }
            do ..SendData($NAMESPACE, ..#ClientPrompt)

        } elseif (action = ..#ServerActionStopTraceAll) { // add/remove

            for i=1:1:$LISTLENGTH(..Watches) {
                d ..StopTracing($LIST(..Watches, i))
            }
            do ..SendData($NAMESPACE, ..#ClientPrompt)

        } elseif (action = ..#ServerActionExecuteSQL) { // sql

            do ..ExecuteSQL(data)
            do ..SendData($NAMESPACE, ..#ClientPrompt)

        } elseif (action = ..#ServerActionGenerateAutocomplete) {

            // data shows if system classes required

            if ('..AutocompleteExists("%")) || (data = "1") {
                do ..GenerateAutocomplete("%SYS", 1)
                do ..SendData("%", ..#ClientLoadAutocomplete)
            }
            do ..GenerateAutocomplete(..CurrentNamespace, 0)
            do ..SendData(..CurrentNamespace, ..#ClientLoadAutocomplete)

        } elseif (action = ..#ServerActionReset) {

            do ..Reset()
            do ..SendData($NAMESPACE, ..#ClientPrompt)

        } elseif (action = ..#ServerActionEcho) {

            do ..StartClearIO()
            write data
            do ..EndClearIO()
            do ..SendData($NAMESPACE, ..#ClientPrompt)

        } elseif (action = ..#ServerActionCheckUpdate) {

            if ('$$$ISOK(..CheckUpdate())) {
                do ..SendData($NAMESPACE, ..#ClientPrompt)
            }

        } elseif (action = ..#ServerActionUpdate) {

            if $$$ISOK(..Update(data)) {
                do ..SendData("39", ..#ClientOutputLocalized)
            } else {
                do ..SendData($NAMESPACE, ..#ClientPrompt)
            }

        } elseif (action = ..#ServerActionRename) {

            set ^WebTerminal("Name") = data
            do ..SendData("56", ..#ClientOutputLocalized)
            do ..SendData($NAMESPACE, ..#ClientPrompt)

        } else { // something scary

            do ..SendData("38", ..#ClientOutputLocalized)
            do ..SendData(" " _ action)
            do ..SendData($NAMESPACE, ..#ClientPrompt)

        }

    }
}

/// This method sends basic login info to the user. Use this method to set client variables
/// during the WebTerminal initialization.
Method SendLoginInfo()
{
    set obj = ##class(%ZEN.proxyObject).%New()
    set obj.username = $USERNAME
    set obj.name = $get(^WebTerminal("Name"))
    
    // "pretty" json formatter
    set data = "{""system"":""" _ $SYSTEM _ """"
    set key = $order(obj.%data(""))
    while (key '= "") {
        set data = data _ ","""_key_""":"""_obj.%data(key)_""""
        set key = $order(obj.%data(key))
    }
    set data = data _ "}"
    
    do ..SendData(data, ..#ClientLoginInfo)
}

/// New connection established: require auth key, login and start client loop.
Method Server() As %Status
{

    if ($$$ISOK(..RequireAuthorization())) {

        set ..CurrentNamespace = $Znspace

        do ..SendData("1", ..#ClientAuthorizationStatus)
        do ..SendData(..CurrentNamespace, ..#ClientChangeNamespace)
        do ..SendLoginInfo()

        use $io:(/NOXY:/BREAK):"^" _ ..InitialZName
        do ..ClientLoop()

    } else {

        do ..SendData("0", ..#ClientAuthorizationStatus)
        do ..EndServer()

    }

    quit $$$OK
}

}
