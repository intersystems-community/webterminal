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
ClassMethod ReceiveChunk(timeout As %Numeric = -1, masterProcess = 0) As %String
{
    set flag = ""
    set str = ""
    set status = -1
    for {
        set message = $system.Event.WaitMsg("", $Case(timeout = -1, 1: 1, :timeout))
        set status = $LISTGET(message, 1)
        set data = $LISTGET(message, 2)
        if (status <= 0) {
            if ($ZPARENT '= 0) && ('$data(^$Job($ZPARENT))) {
                do $system.Process.Terminate($JOB, 0)
                return $LISTBUILD("e", $LISTBUILD("", "Parent process "_$JOB_" is gone"), -1)
            }
            if masterProcess && ($ZCHILD '= 0) && ('$data(^$Job($ZCHILD))) {
                return $LISTBUILD("e", $LISTBUILD("", "Child process "_$ZCHILD_" is gone"), -1)
            }
        }
        if (data = "") && (timeout = 0) quit
        if (status <= 0) {
            set:(timeout = 0) timeout = 1
            continue
        }
        set flag = $LISTGET(data, 1)
        set m = $LISTGET(data, 2)
        set str = str _ m
        if (timeout = 0) set timeout = 1
        quit:($LENGTH(m) '= ..#ChunkSize)
    }
    return $LISTBUILD(flag, str, status)
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

}
