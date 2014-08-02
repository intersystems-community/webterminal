/// This class represents the core of web terminal.
/// All operations with opened WebSocket placed here.
/// 
/// WARNING! Application under development. Security is not guaranteed.
/// 
Class %WebTerminal.Engine Extends (%CSP.WebSocket, %Library.Routine)
{

// USER CONSTANTS BEGIN

/// How long to wait for authorization key when connection established
Parameter authorizationTimeout = 5;

// USER CONSTANTS END

/// This property determines whether the communication between the client and WebSocket server should be over a dedicated Gateway
/// connection or over a pool of shared connections.  It may be set to one of the following:
/// <br><ul>
/// <li><b>SharedConnection=0</b> - The WebSocket server communicates with the client via a dedicated Gateway connection. In this mode of operation the hosting connection is effectively 'private' to the application session.</li>
/// <li><b>SharedConnection=1</b> - The WebSocket server communicates asynchronously with the client via a fixed number of shared Gateway connections.</li>
/// </ul>
Property SharedConnection As %Boolean [ InitialExpression = 0 ];

/// Last joined client id
Property lastClientId As %Numeric [ InitialExpression = 0 ];

Property ConstServerActionExecute As %Char [ InitialExpression = "EXEC" ];

Property ConstServerActionExecuteSQL As %Char [ InitialExpression = "SQL" ];

Property ConstServerActionGenerateAutocomplete As %Char [ InitialExpression = "GAC" ];

Property ConstServerActionWatch As %Char [ InitialExpression = "WATCH" ];

Property ConstServerActionCheckWatches As %Char [ InitialExpression = "CW" ];

Property ConstServerActionReset As %Char [ InitialExpression = "R" ];

Property ConstServerActionEcho As %Char [ InitialExpression = "E" ];

Parameter ConstServerActionExecuteStack = {$c(8)};

Property ConstClientPrompt As %String [ InitialExpression = "PROMPT#" ];

Property ConstClientStartExec As %String [ InitialExpression = "EST#" ];

Property ConstClientEndExec As %String [ InitialExpression = "END#" ];

Property ConstClientOutputMessage As %String [ InitialExpression = "O#" ];

Property ConstClientChangeNamespace As %String [ InitialExpression = "NS#" ];

Property ConstClientLoadAutocomplete As %String [ InitialExpression = "AC#" ];

Property ConstClientReadString As %String [ InitialExpression = "R#" ];

Property ConstClientReadChar As %String [ InitialExpression = "RC#" ];

Property ConstClientAuthorizationStatus As %String [ InitialExpression = "AUTH#" ];

Property ConstClientWatch As %String [ InitialExpression = "WATCH#" ];

Property ConstClientLoginInfo As %String [ InitialExpression = "I#" ];

Property ConstClientClearScreen As %String [ InitialExpression = "CLRSCR#" ];

Property CurrentNamespace As %String;

Property InitialZName As %String;

/// Property is used to store watching files/globals. 
Property Watches As %List;

/// Watch position in file on global
Property WatchesCaret As %Numeric [ MultiDimensional ];

/// Public point entries, using when redirecting i/o
Method redirects() [ Internal, Private, ProcedureBlock = 0 ]
{
PrepareOutput(data)
    Try { Set data=$zconvert(data, "O", "UTF8") } Catch {  }
    quit data
    
PrepareInput(data)
    Try { Set data=$zconvert(data, "I", "UTF8") } Catch {  }
    quit data
    
/// Routine from %CSP.WebSocket.cls
Read(len = 32656, timeout = 86400, BytesAvailable, AtEnd, data, data1, header, size, type)
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
    
//////////////////////////////////////////////
    
wstr(s)
    do ##class(%Device).ReDirectIO($$$NO)
    w "O#", $$PrepareOutput(s), *-3 // ..ConstClientOutputMessage
    do ##class(%Device).ReDirectIO($$$YES)
    quit

wchr(c) 
    do ##class(%Device).ReDirectIO($$$NO)
    w "O#", $$PrepareOutput($c(c)), *-3 // ..ConstClientOutputMessage
    do ##class(%Device).ReDirectIO($$$YES)
    quit

wnl 
    do ##class(%Device).ReDirectIO($$$NO)
    w "O#", $c(13, 10), *-3 // ..ConstClientOutputMessage
    do ##class(%Device).ReDirectIO($$$YES)
    quit

wff 
    do ##class(%Device).ReDirectIO($$$NO)
    w "CLRSCR#", *-3 // ..ConstClientClearScreen
    do ##class(%Device).ReDirectIO($$$YES)
    quit
    
wtab(s)
    do ##class(%Device).ReDirectIO($$$NO)
    w "O#", $$PrepareOutput($C(27) _ "[" _ (s + 1) _ "G"), *-3 // ..ConstClientOutputMessage
    do ##class(%Device).ReDirectIO($$$YES)
    quit
    
rstr(len = 32656, timeout = 86400, data)
    do ##class(%Device).ReDirectIO($$$NO)
    w "R#", len, *-3 // ..ConstClientReadString
    
    s data = $$Read(len, timeout)
    
    do ##class(%Device).ReDirectIO($$$YES)
    quit data
    
rchr(timeout = 86400, data)
    do ##class(%Device).ReDirectIO($$$NO)
    w "RC#", *-3 // ..ConstClientReadChar
    
    set data = $$Read(1, timeout)
    set data = $$PrepareInput($ASCII($EXTRACT(data,1,1)))
    
    do ##class(%Device).ReDirectIO($$$YES)
    quit data
}

Method OnPreServer() As %Status
{
    quit $$$OK
}

/// Chechs for correct watch source and sets watch target to ..Watches
/// Returns status of this operation
Method AddWatch(name) As %Status
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
            do ..SendData(name, ..ConstClientWatch)
            q 1
        }
    } else { // watch file
        if (##class(%File).Exists(name)) {
            set ..Watches = ..Watches _ $LISTBUILD(name)
            set file = ##class(%File).%New(name)
            set ..WatchesCaret(name,0) = file.Size // current watch cursor position
            set ..WatchesCaret(name,1) = file.DateModified
            do ..SendData(name, ..ConstClientWatch)
            q 1
        }
    }
    
    q 0
}

/// Removes watch from watches list
/// Returns success status
Method RemoveWatch(name) As %Status
{
    // absurdly, but working
    set s = $CHAR(0)
    set watches = s _ $LISTTOSTRING(..Watches,s) _ s
    set newWatches = $REPLACE(watches, s_name_s, s)
    set ..Watches = $LISTFROMSTRING($EXTRACT(newWatches, 2, *-1), s)
    if (watches '= newWatches) {
        k ..WatchesCaret(name) // really removed
        do ..SendData(name, ..ConstClientWatch)
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
Method GetWatchGlobalModified(watch) As %String
{
    set data = ""
    if ($data(@watch)=0) {
        do ..RemoveWatch(watch)
        q "removed"
    }
    for {
        set query = $QUERY(@..WatchesCaret(watch,0))
        quit:query=""
        if (data="") set data = "modified"
        set ..WatchesCaret(watch,0) = query
        set data = data _ $CHAR(10) _ @query
    }
    q data
}

Method GetWatchFileModified(watch) As %String
{
    set file=##class(%File).%New(watch)
    set size = file.Size
    set modDate = file.DateModified
    set output = ""
    if (size < 0) { // file had been deleted
         
        do ..RemoveWatch(watch)
        q "removed"
        
    }
    if (size > ..WatchesCaret(watch, 0)) {
        
        set output = "updated" _ $CHAR(10)
        set stream=##class(%Stream.FileBinary).%New()
        set sc=stream.LinkToFile(watch)
        do stream.MoveTo(..WatchesCaret(watch, 0) + 1)
        set readed = stream.Read(size - ..WatchesCaret(watch, 0))
        set output=output_readed
        set ..WatchesCaret(watch, 0) = size
        set ..WatchesCaret(watch, 1) = file.DateModified
        
    } elseif ((size < ..WatchesCaret(watch, 0)) || (file.DateModified '= ..WatchesCaret(watch, 1))) {
        
        set output = "modified" _ $CHAR(10)
        set output = output _ "Bytes changed: " _ (size - ..WatchesCaret(watch, 0))
        set ..WatchesCaret(watch, 0) = size
        set ..WatchesCaret(watch, 1) = file.DateModified
        
    } // else file not changed
    q output
}

Method CheckWatches() As %String
{
    set no = 0
    set data = ""
    set overal = ""
    set watchList = ..Watches // do not remove or simplify: ..Watches can be modified
    while $LISTNEXT(watchList, no, value) {
        if ($EXTRACT(value, 1, 1) = "^") {
            set data = ..GetWatchGlobalModified(value)
        } else {
            set data = ..GetWatchFileModified(value)
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
        $ZCONVERT($REPLACE($namespace,"%",""),"l")
    )
    set data = ##class(%Library.File).SubDirectoryName(data, "WebTerminal")
    set data = ##class(%Library.File).SubDirectoryName(data, "js")
    set data = ##class(%Library.File).SubDirectoryName(data, "autocomplete")
    set data = ##class(%Library.File).SubDirectoryName(data, 
        $REPLACE(namespace,"%","_") _ ".js"
    )
    
    //set data = data _ "CSP\sys\webTerminal\js\autocomplete\" _
    //  $REPLACE(namespace,"%","_") _ ".js" // UNIX?
    //set data = data _ $REPLACE(namespace,"%","_") _ ".js"
    
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
Method GenerateAutocompleteFile(namespace As %String, newFile As %Boolean) As %String
{
    
    set filename = ..GetJSAutocompleteFilePath($NAMESPACE)
    
    set system = 0
    if (namespace = "%") {
        set namespace = "%SYS"
        set filename = ..GetJSAutocompleteFilePath("_")
        set system = 1
    }
    
    if (system) && (##class(%File).Exists(filename)) {
        do ..SendData("_", ..ConstClientLoadAutocomplete)
        quit $$$OK
    }
    
    do ..StartClearIO()
    
    if ('##class(%SYS.Namespace).Exists(namespace)) {
        do ..EndClearIO()
        do ..SendData("Wrong namespace: " _ namespace)
        quit $$$NOTOK
    }
    
    set namespace = $REPLACE(namespace,"%","_")
    
    if (##class(%File).Exists(filename)) && (newFile = 0) {
        
        do ..EndClearIO()
        do ..SendData(namespace, ..ConstClientLoadAutocomplete)
        quit $$$OK
        
    } elseif ('##class(%File).DirectoryExists(##class(%File).GetDirectory(filename))) {
        
        // try to create missed directory
        set result = ##class(%File).CreateDirectoryChain(##class(%File).GetDirectory(filename))
        
        if (result '= 1) {
            do ..EndClearIO()
            do ..SendData("Autocomplete fail: can't create directory js/autocomplete.")
            quit $$$OK
        }
        
    }

    set thisName = $REPLACE(namespace,"_","%")
    if (system) { set thisName = "SYSTEM" }
    do ..SendData("Generating language file for " _ thisName _ ", pleace, wait. ")
        
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
    
    set file=##class(%File).%New(filename)
    do file.Open("WSN")
    
    // final data generation
    do file.Write("{""class"":{")
    set first = ""
    
    while (result.Next()) { // forming autocomplete for each class
    
        set className = result.Data("Name")
        if (($EXTRACT(className,1)="%")'=system) {
            continue
        }
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
    if ('system) {
        do file.Write(",""global"":" _ ..getGlobalsJSON())  
    }
    do file.Write("}")
    do file.Close()
    
    do ..SendData($c(10)_"Language file for " _ thisName _ " generated.")
    
    do ..EndClearIO()
    if (system) {
        do ..SendData("_",..ConstClientLoadAutocomplete)
    } else { do ..SendData(namespace,..ConstClientLoadAutocomplete) }
    
    quit $$$OK
}

/// Generating new authorization key
ClassMethod GenerateAuthKey() As %String
{
    set ^|"%SYS"|%WebTerminal.AuthKey = $SYSTEM.Util.CreateGUID()
}

/// Returns key for client authorization.
/// If the key is empty, generates new key value.
ClassMethod GetAuthKey() As %String
{
    if ($get(^|"%SYS"|%WebTerminal.AuthKey) = "") {
        Do ..GenerateAuthKey()
    }
    quit ^|"%SYS"|%WebTerminal.AuthKey
}

/// Backs terminal to default state
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
    do ..Write(action _ query) // using CTWPv3
}

Method ExecuteSQL(query As %String = "") As %Status
{
    do ..StartClearIO()
    do ##class(%Device).ReDirectIO($$$YES)
    
    set tStatement = ##class(%SQL.Statement).%New()
    set qStatus = tStatement.%Prepare(query)
    if qStatus'=1 {
        write "SQL prepare error: ",$System.Status.DisplayError(qStatus)
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
    set authKey = ..Read(,.status,..#authorizationTimeout) // wait for package
    set ok = $$$NOTOK
    
    /*
     * Find given CSPSessionCookie in session list. If found, grant access
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
                    do ..SendData(user,..ConstClientLoginInfo)
                } else {
                    do ..SendData("!",..ConstClientLoginInfo)
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
/// 
/// Authorization process description:
///     1.  Client requests cache server page called "WebTerminal.csp";
///     2.  Server return this page with ClassMethod GetAuthKey() value;
///     3.  After client receives page, it performs websocket connection;
///         to same web-resource, but with next URL changes:
///         "http://" -> "ws://", "WebTerminal.csp" -> "Webterminal.Engine.cls";
///     4.  After connection established, client sends his AuthKey to server
///         and removes it locally (because it needed only one time);
///     5.  Server compares again received key with ..GetAuthKey() value and
///         grants permission, if keys are equal.
///     >>  As a result - there is no way to autorize via websocket without
///         accessing WebTerminal.csp.
/// 
/// Method description:
///     First, method requires from client 
///     a key, which will be compared with ..GetAuthKey() (global). If 
///     succeeded, method sets "authorized" flag to true and changes global
///     key with ..GenerateAuthKey() for the next client.
Method ClientLoop() As %Status
{
    
    kill // clear junk vars
    
    for {
        
        do ..SendData($NAMESPACE, ..ConstClientPrompt)
        set data = ..Read(,.status)
    
        if $$$ISERR(status) {
       
            try {
                do ..SendData("Error occured while reading data.",
                ..ConstClientOutputMessage)
            } catch e { }
            quit:($$$GETERRORCODE(status)=$$$CSPWebSocketClosed)
            
        }
        
        set pos = $FIND(data, "#")
        set action = $EXTRACT(data, 1, pos-2)
        set data = $EXTRACT(data, pos, *)
            
        if (action = ..ConstServerActionExecute) {
            
            do ..ExecuteCommand(data)
                
        } elseif (action = ..ConstServerActionCheckWatches) {
        
            set changes = ..CheckWatches()
            if (changes '= "") {
                do ..SendData(changes)   
            }
          
        } elseif (action = ..ConstServerActionWatch) { // add/remove
        
            set result = ..AddWatch(data)
            if ('$$$ISOK(result)) {
                set result = ..RemoveWatch(data)
                if ('$$$ISOK(result)) {
                    do ..SendData("!" _ data, ..ConstClientWatch)
                }
            }
          
        } elseif (action = ..ConstServerActionExecuteSQL) { // sql
        
            do ..ExecuteSQL(data)
          
        } elseif (action = ..ConstServerActionGenerateAutocomplete) {
            
            do ..GenerateAutocompleteFile("%", data)
            do ..GenerateAutocompleteFile(..CurrentNamespace, data)
                    
        } elseif (action = ..ConstServerActionReset) {
              
            if ($$$ISOK(..Reset())) {
                do ..SendData("Terminal state reseted.")
            } else {
                do ..SendData("Error while reseting terminal state.")
            }
                    
        } elseif (action = ..ConstServerActionEcho) {
              
            do ..StartClearIO()
            write data
            do ..EndClearIO()
                    
        } else { // something scary
                
            do ..SendData("Client action unrecognised: " _ action)
                    
        }
            
    }
}

/// New connection established
Method Server() As %Status
{
    
    /*COMMENT ON RELEASE!*/
    ZNSPACE "%SYS" // namespace
    set loginStatus = ##class(%SYSTEM.Security).Login("_SYSTEM") // login user
    if ($$$ISOK(loginStatus)) { // alert client
        do ..SendData($SYSTEM _ ":" _ $USERNAME, ..ConstClientLoginInfo)
    } else {
        do ..SendData("!",..ConstClientLoginInfo)
    }
    
    /*UNCOMMENT ON RELEASE!*/
    if (1/*$$$ISOK(..RequireAuthorization())*/) {
        
        set ..InitialZName = $Zname
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
