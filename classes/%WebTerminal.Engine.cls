/// This class represents the core of web terminal.
Class %WebTerminal.Engine Extends (%CSP.WebSocket, %Library.Routine)
{

// CONSTANTS BEGIN

/// How long to wait for authorization key when connection established
Parameter authorizationTimeout = 5;

Property ConstServerActionExecute As %Char [ InitialExpression = "EXEC" ];

Property ConstServerActionExecuteSQL As %Char [ InitialExpression = "SQL" ];

Property ConstServerActionGenerateAutocomplete As %Char [ InitialExpression = "AC" ];

Property ConstServerActionTrace As %Char [ InitialExpression = "TRACE" ];

Property ConstServerActionStopTraceAll As %Char [ InitialExpression = "STOP_TRACE_ALL" ];

Property ConstServerActionCheckTrace As %Char [ InitialExpression = "CT" ];

Property ConstServerActionReset As %Char [ InitialExpression = "R" ];

Property ConstServerActionEcho As %Char [ InitialExpression = "E" ];

Property ConstServerActionCheckUpdate As %Char [ InitialExpression = "CU" ];

Property ConstServerActionUpdate As %Char [ InitialExpression = "U" ];

Property ConstClientPrompt As %String [ InitialExpression = "PROMPT#" ];

Property ConstClientStartExec As %String [ InitialExpression = "EST#" ];

Property ConstClientEndExec As %String [ InitialExpression = "END#" ];

Property ConstClientOutputMessage As %String [ InitialExpression = "O#" ];

Property ConstClientOutputLocalized As %String [ InitialExpression = "OL#" ];

Property ConstClientChangeNamespace As %String [ InitialExpression = "NS#" ];

Property ConstClientLoadAutocomplete As %String [ InitialExpression = "AC#" ];

Property ConstClientReadString As %String [ InitialExpression = "R#" ];

Property ConstClientReadChar As %String [ InitialExpression = "RC#" ];

Property ConstClientAuthorizationStatus As %String [ InitialExpression = "AUTH#" ];

Property ConstClientTrace As %String [ InitialExpression = "TRACE#" ];

Property ConstClientStopTrace As %String [ InitialExpression = "STOP_TRACE#" ];

Property ConstClientLoginInfo As %String [ InitialExpression = "I#" ];

Property ConstClientClearScreen As %String [ InitialExpression = "CLRSCR#" ];

Property ConstClientPromptUpdate As %String [ InitialExpression = "PROMPT_UPDATE#" ];

// CONSTANTS END

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

/// Property is used to store watching files/globals. 
Property Watches As %List;

/// Watch position in file on global
Property WatchesCaret As %Numeric [ MultiDimensional ];

/// Public point entries, using when redirecting i/o
Method redirects() [ Private, ProcedureBlock = 0 ]
{
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

/// Workaround for Caché 2015
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
    quit

wchr(c) 
    do ##class(%Device).ReDirectIO($$$NO)
    do WriteMessage("O#"_$c(c))
    do ##class(%Device).ReDirectIO($$$YES)
    quit

wnl 
    do ##class(%Device).ReDirectIO($$$NO)
    do WriteMessage("O#"_$c(13, 10))
    do ##class(%Device).ReDirectIO($$$YES)
    quit

wff 
    do ##class(%Device).ReDirectIO($$$NO)
    do WriteMessage("CLRSCR#")
    do ##class(%Device).ReDirectIO($$$YES)
    quit
    
wtab(s)
    do ##class(%Device).ReDirectIO($$$NO)
    do WriteMessage("O#" _ $C(27) _ "[" _ (s + 1) _ "G")
    do ##class(%Device).ReDirectIO($$$YES)
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
    set data = $$ReadMessage(1, timeout)
    set data = $ASCII($EXTRACT(data,1,1))
    do ##class(%Device).ReDirectIO($$$YES)
    quit data
}

Method OnPreServer() As %Status
{
    set ..InitialZName = $zname
    set ..InitialZNamespace = $znspace
    quit $$$OK
}

/// Chechs for correct watch source and sets watch target to ..Watches
/// Returns status of this operation
Method Trace(name) As %Status
{
    set s = $CHAR(0)
    set watches = s _ $LISTTOSTRING(..Watches, s) _ s
    if ($FIND(watches, s_name_s) '= 0) q 0 // if watch already defined
    
    if ($EXTRACT(name,1,1) = "^") { // watching global
        s g = 0
        try {
            if (($data(@name))'=0) s g = 1
        } catch {  }
        set $ZERROR = ""
        if (g = 1) {
            set ..Watches = ..Watches _ $LISTBUILD(name)
            set ..WatchesCaret(name,0) = $QUERY(@name@(""),-1) // last
            set ..WatchesCaret(name,1) = "?"
            do ..SendData(name, ..ConstClientTrace)
            q 1
        }
    } else { // watch file
        if (##class(%File).Exists(name)) {
            set ..Watches = ..Watches _ $LISTBUILD(name)
            set file = ##class(%File).%New(name)
            set ..WatchesCaret(name,0) = file.Size // current watch cursor position
            set ..WatchesCaret(name,1) = file.DateModified
            do ..SendData(name, ..ConstClientTrace)
            q 1
        }
    }
    
    q 0
}

/// Removes watch from watches list
/// Returns success status
Method StopTracing(name) As %Status
{
    // absurdly, but working
    set s = $CHAR(0)
    set watches = s _ $LISTTOSTRING(..Watches,s) _ s
    set newWatches = $REPLACE(watches, s_name_s, s)
    set ..Watches = $LISTFROMSTRING($EXTRACT(newWatches, 2, *-1), s)
    if (watches '= newWatches) {
        k ..WatchesCaret(name) // really removed
        do ..SendData(name, ..ConstClientStopTrace)
    }
    quit watches '= newWatches
}

/// Returns a list current watches
Method ListWatches() As %String
{
    set no=0
    set s = "Watching: " _ $CHAR(10)
    while $LISTNEXT(..Watches, no, value) {
        set s = s_"(pos: "_..WatchesCaret(value,0)_
        "; mod: "_..WatchesCaret(value,1)_") "_value_$CHAR(10)
    }
    q s
}

/// Return null string if global hadn't been updated
/// This method watches only for tail of global and detects if global still alive
Method GetTraceGlobalModified(watch) As %String
{
    set data = ""
    if ($data(@watch)=0) {
        do ..StopTracing(watch)
        q "removed"
    }
    for {
        set query = $QUERY(@..WatchesCaret(watch,0))
        quit:query=""
        if (data="") set data = "modified"
        set ..WatchesCaret(watch,0) = query
        set data = data _ $CHAR(13, 10) _ @query
    }
    q data
}

Method GetTraceFileModified(watch) As %String
{
    set file=##class(%File).%New(watch)
    set size = file.Size
    set modDate = file.DateModified
    set output = ""
    if (size < 0) { // file had been deleted
         
        do ..StopTracing(watch)
        q "removed"
        
    }
    
    if (size > ..WatchesCaret(watch, 0)) {
        
        set output = "updated" _ $CHAR(13, 10)
        set stream=##class(%Stream.FileBinary).%New()
        set sc=stream.LinkToFile(watch)
        do stream.MoveTo(..WatchesCaret(watch, 0) + 1)
        set readed = stream.Read(size - ..WatchesCaret(watch, 0))
        set output=output_readed
        set ..WatchesCaret(watch, 0) = size
        set ..WatchesCaret(watch, 1) = file.DateModified
        
    } elseif ((size < ..WatchesCaret(watch, 0)) || (file.DateModified '= ..WatchesCaret(watch, 1))) {
        
        set output = "modified" _ $CHAR(13, 10)
        set output = output _ "Bytes changed: " _ (size - ..WatchesCaret(watch, 0))
        set ..WatchesCaret(watch, 0) = size
        set ..WatchesCaret(watch, 1) = file.DateModified
        
    } // else file not changed
    q output
}

Method CheckTracing() As %String
{
    set no = 0
    set data = ""
    set overal = ""
    set watchList = ..Watches // do not remove or simplify: ..Watches can be modified
    while $LISTNEXT(watchList, no, value) {
        if ($EXTRACT(value, 1, 1) = "^") {
            set data = ..GetTraceGlobalModified(value)
        } else {
            set data = ..GetTraceFileModified(value)
        }
        if (data '= "") {
            set overal = $ZDATETIME($NOW(),1,1) _ " " _
            value _ ": " _ data _ $CHAR(10) 
        }
        set data = ""
    }
    q overal
}

Method OnPostServer() As %Status
{
    kill ^CacheTemp.WebTerminal.Watching
    quit $$$OK
}

ClassMethod GetJSAutocompleteFilePath(namespace As %String) As %String
{
    set data = ##class(%Library.File).ManagerDirectory()
    set data = ##class(%Library.File).ParentDirectoryName(data)
    
    set dataTest = ##class(%Library.File).SubDirectoryName(data, "CSP")
    if (##class(%Library.File).DirectoryExists(dataTest)) {
        set data = ##class(%Library.File).SubDirectoryName(data, "CSP")
    } else {
        set data = ##class(%Library.File).SubDirectoryName(data, "csp")
    }
    
    set data = ##class(%Library.File).SubDirectoryName(data,
        $ZCONVERT($REPLACE("%SYS", "%", ""), "l")
    )
    set data = ##class(%Library.File).SubDirectoryName(data, "WebTerminal")
    set data = ##class(%Library.File).SubDirectoryName(data, "js")
    set data = ##class(%Library.File).SubDirectoryName(data, "autocomplete")
    set data = ##class(%Library.File).SubDirectoryName(data, namespace _ ".js")
    
    quit data
}

ClassMethod WriteToFile(filename As %String, data As %String) As %Status
{
    set file=##class(%File).%New(filename)
    do file.Open("WSN")
    do file.WriteLine(data)
    do file.Close()
}

ClassMethod getGlobalsJSON(namespace As %String) As %String
{

    set out = "{"
    set rset=##class(%ResultSet).%New("%SYS.GlobalQuery:NameSpaceList")
    set sc=rset.Execute($ZNSPACE,"*",0)
    while (rset.Next()) {
        set out = out _ """" _ $Piece(rset.GetData(1),"(",1) _ """:0,"
    }
    set out = $EXTRACT(out,1,$LENGTH(out)-1) _ "}"
    q out
}

/// Generates autocomplete file for namespace. Second parameter deсides if
/// it will be regenerated again. But if namespace equals to "%" - generates
/// autocomplete file for system classes. Make sure that autocomplete for
/// system classes generates one time and forever.
/// @param genSystem - Shows if system classes need to be generated. 
Method GenerateAutocompleteFile(namespace As %String, genSystem As %Boolean) As %String
{
    
    if (genSystem) {
        set filename = ..GetJSAutocompleteFilePath("%")
    } else {
        set filename = ..GetJSAutocompleteFilePath(namespace)
    }
    
    do ..SendData("29", ..ConstClientOutputLocalized)
    do ..SendData(" " _ filename _ $C(13, 10))
    
    if ('##class(%SYS.Namespace).Exists(namespace)) {
        do ..SendData("30", ..ConstClientOutputLocalized)
        do ..SendData(" " _ namespace _ $C(13, 10))
        quit $$$NOTOK
    }
    
    if ('##class(%File).DirectoryExists(##class(%File).GetDirectory(filename))) {
        
        // try to create missed directory
        set result = ##class(%File).CreateDirectoryChain(##class(%File).GetDirectory(filename))
        
        if (result '= 1) {
            do ..SendData("31", ..ConstClientOutputLocalized)
            do ..SendData($C(13, 10))
            quit $$$OK
        }
        
    }

    // get all classes names
    set result = ##class(%ResultSet).%New("%Dictionary.ClassDefinition:Summary")
    do result.Execute()
    
    /*  
    The next COULD BE IMPROVED FOR SPEED, I beleive.
    Generates compressed JSON string of type:
    {
        "class": {
            "%ClassName1": {
                "methodName": 0,
                "propertyName": 0,
                "parameterName": 0,
                ...
            },
            "ClassName2": {
                ...
            }
        },
        "global": {
            "^%g1": 0,
            "^g2": 0
        }
    }
    */
    
    do ..SendData($C(13, 10))
    do ..SendData("32", ..ConstClientOutputLocalized)
    
    set file=##class(%File).%New(filename)
    do file.Open("WSN")
    
    // final data generation
    do file.Write("{""class"":{")
    set first = ""
    set u = 1
    
    while (result.Next()) { // forming autocomplete for each class
    
        if (genSystem) '= ($Extract(result.Data("Name"), 1) = "%") {
            continue
        }
    
        set className = result.Data("Name")
        
        do ..SendData($C(27) _ "[30G" _ u)
        s u = u + 1
        
        do file.Write(first _ """" _ className _ """:{")
        if (first = "") set first = ","
        
        set cdefs = ##class(%Dictionary.ClassDefinition).%OpenId(className)
        
        set countMethods = cdefs.Methods.Count()
        set countParameters = cdefs.Parameters.Count()
        set countProperties = cdefs.Properties.Count()
        set total = countMethods + countParameters + countProperties
        set current = 0
        
        for i=1:1:countMethods {
            set current = current + 1
            do file.Write("""" _ cdefs.Methods.GetAt(i).Name _ """:0")
            if (current'=total) do file.Write(",")
        }
        
        for i=1:1:countProperties {
            set current = current + 1
            do file.Write("""" _ cdefs.Properties.GetAt(i).Name _ """:0")
            if (current'=total) do file.Write(",")
        }
        
        for i=1:1:countParameters {
            set current = current + 1
            do file.Write("""" _ cdefs.Parameters.GetAt(i).Name _ """:0")
            if (current'=total) do file.Write(",")
        }
        
        do file.Write("}")
        
    }
    
    do file.Write("}")
    if ('genSystem) do file.Write(",""global"":" _ ..getGlobalsJSON())
    do file.Write("}")
    do file.Close()
    
    do ..SendData($C(13, 10))
    do ..SendData("33", ..ConstClientOutputLocalized)
    do ..SendData($C(13, 10))
    //do ..SendData(namespace, ..ConstClientLoadAutocomplete)
    
    quit $$$OK
}

/// Returns terminal to default state
ClassMethod Reset() As %Status
{
    // delete autocompletion files
    set dir = ##class(%File).GetDirectory(..GetJSAutocompleteFilePath("TEST"))
    if (##class(%File).DirectoryExists(dir)) {
        do ##class(%File).RemoveDirectoryTree(dir)
    }
    quit $$$OK
}

/// Function sends data derectly to server with specified action
Method SendData(query As %String = "", action As %String = "") As %Status
{
    if (action = "") { set action = ..ConstClientOutputMessage }
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
        do ..SendData(..CurrentNamespace,..ConstClientChangeNamespace) 
    }
}

/// Starts clear I/O mode
Method StartClearIO()
{
    write *-3
    do ..Write(..ConstClientStartExec)
    write *-3
    do ##class(%Device).ReDirectIO($$$YES)
}

/// Ends clear I/O mode
Method EndClearIO()
{
    //write *-3
    do ##class(%Device).ReDirectIO($$$NO)
    do ..SendData("",..ConstClientEndExec)
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
    do ..SendData("34", ..ConstClientOutputLocalized)
    do ..SendData("http://intersystems-ru.github.io/webterminal/files/WebTerminal-"
        _ version _ ".xml ")
    do httprequest.Get("/webterminal/files/WebTerminal-" _ version _ ".xml")
    if (httprequest.HttpResponse.StatusCode '= 200) {
        do ..SendData($C(27)_"[31mFAIL" _ $C(27) _ "[0m (status code "
            _ httprequest.HttpResponse.StatusCode _ ")" _ $C(13,10))
        quit $$$NOTOK
    }
    do ..SendData($C(27)_"[32mOK" _ $C(27) _ "[0m")
    if ($isobject(httprequest.HttpResponse.Data)) {
        do ..SendData($C(13,10))
        set data = ""
        set path = ##class(%Library.File).SubDirectoryName(
            ##class(%Library.File).ManagerDirectory(), "temp"
        )
        set filepath = ##class(%Library.File).SubDirectoryName(
            path, "terminal_update.temp.xml"
        )
        do ..SendData("35", ..ConstClientOutputLocalized)
        do ..SendData($C(13, 10))
        set file = ##class(%File).%New(filepath)
        do file.Open("W")
        do file.CopyFrom(httprequest.HttpResponse.Data)
        do file.Close()
        do ..SendData("36", ..ConstClientOutputLocalized)
        do ..SendData($C(13, 10))
        set error = 0
        do ..StartClearIO()
        do $System.OBJ.ImportDir(path, "terminal_update.temp.xml", "ckbud", .error, 1)
        do ..EndClearIO()
        if (error = 0) {
            do ..SendData($C(27)_"[32mOK" _ $C(27) _ "[0m" _ $C(13,10))
        } else {
            do ..SendData($C(27)_"[31mFAIL" _ $C(27) _ "[0m" _ $C(13,10))
        }
        do ..SendData("37", ..ConstClientOutputLocalized)
        if (##class(%Library.File).Delete(filepath) = 1) {
            do ..SendData($C(27)_"[32mOK" _ $C(27) _ "[0m" _ $C(13,10))
        } else {
            do ..SendData($C(27)_"[31mFAIL" _ $C(27) _ "[0m" _ $C(13,10))
            quit $$$NOTOK
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
        do ..SendData(httprequest.HttpResponse.Data.Read(), ..ConstClientPromptUpdate)
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
    set authKey = ..Read(, .status, ..#authorizationTimeout) // wait for package
    set ok = $$$NOTOK
    
    /*
     * Find given CSPSessionCookie in session list. If found, grant access.
     */
    SET key = $ORDER(^%cspSession(""))
    WHILE (key '= "") {
        set lb = $GET(^%cspSession(key))
        if (lb '= "") {
            if ($LISTGET(lb, 8) = authKey) {
                
                // setup privileges
                ZNSPACE $LISTGET(lb, 7) // namespace
                
                set user = $LISTGET($LISTGET(lb, 16), 1) // user
                set loginStatus = ##class(%SYSTEM.Security).Login($LISTGET($LISTGET(lb, 16), 1)) // login user
                
                if ($$$ISOK(loginStatus)) { // alert client
                    do ..SendData($SYSTEM _ ":" _ user, ..ConstClientLoginInfo)
                } else {
                    do ..SendData("!", ..ConstClientLoginInfo)
                }
                
                set ok = loginStatus
                QUIT
                
            }
        }
        SET key = $ORDER(^%cspSession(key))
    }
    
    quit ok
}

/// Main method for every new client.
Method ClientLoop() As %Status
{
    
    kill // clear junk vars
    
    do ..SendData($NAMESPACE, ..ConstClientPrompt)
    
    for {
        
        set data = ..Read(,.status)
    
        if $$$ISERR(status) {
       
            try {
                do ..SendData("40", ..ConstClientOutputLocalized)
            } catch e { }
            quit:($$$GETERRORCODE(status)=$$$CSPWebSocketClosed)
            
        }
        
        set pos = $FIND(data, "#")
        set action = $EXTRACT(data, 1, pos-2)
        set data = $EXTRACT(data, pos, *)
            
        if (action = ..ConstServerActionExecute) {
            
            do ..ExecuteCommand(data)
            do ..SendData($NAMESPACE, ..ConstClientPrompt)
                
        } elseif (action = ..ConstServerActionCheckTrace) {
        
            set changes = ..CheckTracing()
            if (changes '= "") {
                do ..SendData(changes)   
            }
          
        } elseif (action = ..ConstServerActionTrace) { // add/remove
        
            set result = ..Trace(data)
            if ('$$$ISOK(result)) {
                set result = ..StopTracing(data)
                if ('$$$ISOK(result)) {
                    do ..SendData("!" _ data, ..ConstClientTrace)
                }
            }
            do ..SendData($NAMESPACE, ..ConstClientPrompt)
          
        } elseif (action = ..ConstServerActionStopTraceAll) { // add/remove
        
            FOR i=1:1:$LISTLENGTH(..Watches) {
                d ..StopTracing($LIST(..Watches, i))
            }
            do ..SendData($NAMESPACE, ..ConstClientPrompt)
          
        } elseif (action = ..ConstServerActionExecuteSQL) { // sql
        
            do ..ExecuteSQL(data)
            do ..SendData($NAMESPACE, ..ConstClientPrompt)
          
        } elseif (action = ..ConstServerActionGenerateAutocomplete) {
            
            // data shows if system classes required
            
            if ('##class("%Library.File").Exists(..GetJSAutocompleteFilePath("%")))
                || (data = "1") {
                do ..GenerateAutocompleteFile("%SYS", 1)
                do ..SendData("%", ..ConstClientLoadAutocomplete)
            }
            do ..GenerateAutocompleteFile(..CurrentNamespace, 0)
            do ..SendData(..CurrentNamespace, ..ConstClientLoadAutocomplete)
                    
        } elseif (action = ..ConstServerActionReset) {
              
            do ..Reset()
            do ..SendData($NAMESPACE, ..ConstClientPrompt)
                    
        } elseif (action = ..ConstServerActionEcho) {
              
            do ..StartClearIO()
            write data
            do ..EndClearIO()
            do ..SendData($NAMESPACE, ..ConstClientPrompt)
                    
        } elseif (action = ..ConstServerActionCheckUpdate) {
            
            do ..CheckUpdate()
            
        } elseif (action = ..ConstServerActionUpdate) {
            
            do ..Update(data)
            do ..SendData("39", ..ConstClientOutputLocalized)
            
        } else { // something scary
                
            do ..SendData("38", ..ConstClientOutputLocalized)
            do ..SendData(" " _ action)
            do ..SendData($NAMESPACE, ..ConstClientPrompt)
                    
        }
            
    }
}

/// New connection established: require auth key, login and start client loop.
Method Server() As %Status
{
    
    /*UNCOMMENT ON RELEASE!*/
    if ($$$ISOK(..RequireAuthorization())) {
        
        set ..CurrentNamespace = $Znspace
        
        do ..SendData("1", ..ConstClientAuthorizationStatus)
        do ..SendData(..CurrentNamespace, ..ConstClientChangeNamespace)
           
        use $io::("^" _ ..InitialZName) // switch to routine
        do ..ClientLoop()
        
    } else {
        
        do ..SendData("0", ..ConstClientAuthorizationStatus)
        do ..EndServer()
            
    }
    
    quit $$$OK
}

}
