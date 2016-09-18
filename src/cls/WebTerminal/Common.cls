Include %sySystem

Class WebTerminal.Common
{

/// Interprocess communication cannot handle big messages at once, so they need to be split.

Parameter ChunkSize = 45;

/// Send the chunk of data to another process. The process need to receive the chunk with the
/// appropriate function ReceiveChunk. Consider event length less than 44 characters long.
ClassMethod SendChunk(pid As %Numeric, flag As %String, data As %String = "") As %Status
{
    set pos = 1
    set len = $LENGTH(data) + 1 // send the last empty message if the data size = ChunkSize
    for {
        try {
            set st = $system.Event.Signal(
                pid,
                $LB(flag, $EXTRACT(data, pos, pos + ..#ChunkSize - 1))
            )
        } catch (e) { return $$$NOTOK }
        if (st '= 1) { return $$$NOTOK }
        set pos = pos + ..#ChunkSize
        if (pos > len) { quit }
    }
    return $$$OK
}

/// Receives the chunk of data from another process. Returns the $LISTBUILD string which contains
/// flag at the first position and string at the second. This method also terminates the process
/// if the parent process is gone.
ClassMethod ReceiveChunk() As %String
{
    set flag = ""
    set str = ""
    for {
        set message = $system.Event.WaitMsg("", 1)
        set status = $LISTGET(message, 1)
        if (status <= 0) {
            do:'$data(^$Job($ZPARENT)) $system.Process.Terminate($JOB, 0)
            continue
        }
        set data = $LISTGET(message, 2)
        set flag = $LISTGET(data, 1)
        set m = $LISTGET(data, 2)
        set str = str _ m
        quit:($LENGTH(m) '= ..#ChunkSize)
    }
    return $LISTBUILD(flag, str)
}

/// Returns the contents of the proxy object to the current device in JSON format.<br/>
/// This method is called when a proxy object is used in conjunction with
/// the <class>%ZEN.Auxiliary.jsonProvider</class> component.<br/>
/// <var>format</var> is a flags string to control output formatting options.<br/>
/// The following character option codes are supported:<br/>
/// 1-9 : indent with this number of spaces (4 is the default with the 'i' format specifier)<br/>
/// a - output null arrays/objects<br/>
/// b - line break before opening { of objects<br/>
/// c - output the Cach&eacute;-specific "_class" and "_id" properties (if a child property is an instance of a concrete object class)<br/>
/// e - output empty object properties<br/>
/// i - indent with 4 spaces unless 't' or 1-9<br/>
/// l - output empty lists<br/>
/// n - newline (lf)<br/>
/// o - output empty arrays/objects<br/>
/// q - output numeric values unquoted even when they come from a non-numeric property<br/>
/// s - use strict JSON output - <strong>NOTE:</strong> special care should be taken when sending data to a browser, as using this flag
/// may expose you to cross site scripting (XSS) vulnerabilities if the data is sent inside <code>&lt;script&gt;</code> tags. Zen uses
/// this technique extensively, so this flag should <strong>NOT</strong> be specified for jsonProviders in Zen pages.<br/>
/// t - indent with tab character<br/>
/// u - output pre-converted to UTF-8 instead of in native internal format<br/>
/// w - Windows-style cr/lf newline<br/>
ClassMethod GetJSONString(obj As %ZEN.proxyObject, format As %String = "aeos") As %String [ ProcedureBlock = 0 ]
{
    set tOldIORedirected = ##class(%Device).ReDirectIO()
    set tOldMnemonic = ##class(%Device).GetMnemonicRoutine()
    set tOldIO = $io
    try {
        set str = ""
        use $io::("^" _ $ZNAME)
        do ##class(%Device).ReDirectIO(1)
        do ##class(%ZEN.Auxiliary.jsonProvider).%ObjectToJSON(obj,,,format)
    } catch ex {
        set str = ""
    }
    if (tOldMnemonic '= "") {
        use tOldIO::("^" _ tOldMnemonic)
    } else {
        use tOldIO
    }
    do ##class(%Device).ReDirectIO(tOldIORedirected)
    return str

rchr(c)
    quit
rstr(sz,to)
    quit
wchr(s)
    do output($char(s))
    quit
wff()
    do output($char(12))
    quit
wnl()
    do output($char(13,10))
    quit
wstr(s)
    do output(s)
    quit
wtab(s)
    do output($char(9))
    quit
output(s)
    set str = str _ s
    quit
}

/// How long to wait for authorization key when connection established
Parameter AuthorizationTimeout = 5;

Parameter ServerActionExecute As %Char = "EXEC";

Parameter ServerActionExecuteSQL As %Char = "SQL";

Parameter ServerActionGenerateAutocomplete As %Char = "AC";

Parameter ServerActionTrace As %Char = "TRACE";

Parameter ServerActionStopTraceAll As %Char = "STOP_TRACE_ALL";

Parameter ServerActionCheckTrace As %Char = "CT";

Parameter ServerActionReset As %Char = "R";

Parameter ServerActionEcho As %Char = "E";

Parameter ServerActionCheckUpdate As %Char = "CU";

Parameter ServerActionUpdate As %Char = "U";

Parameter ServerActionRename As %Char = "RENAME";

Parameter ClientPrompt As %String = "PROMPT#";

Parameter ClientStartExec As %String = "EST#";

Parameter ClientEndExec As %String = "END#";

Parameter ClientOutputMessage As %String = "O#";

Parameter ClientOutputLocalized As %String = "OL#";

Parameter ClientChangeNamespace As %String = "NS#";

Parameter ClientLoadAutocomplete As %String = "AC#";

Parameter ClientReadString As %String = "R#";

Parameter ClientReadChar As %String = "RC#";

Parameter ClientAuthorizationStatus As %String = "AUTH#";

Parameter ClientTrace As %String = "TRACE#";

Parameter ClientStopTrace As %String = "STOP_TRACE#";

Parameter ClientLoginInfo As %String = "I#";

Parameter ClientClearScreen As %String = "CLRSCR#";

Parameter ClientPromptUpdate As %String = "PROMPT_UPDATE#";

Method SendData(query As %String = "", action As %String = "") As %Status
{
    write query,$c(9),action
    quit $$$OK
}

}
