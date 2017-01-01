/// <!-- @echo package.title --> version <!-- @echo package.version --> core.
/// The core class which handles client requests and executes COS code.
/// All writes used here are used for $X and $Y compatibility, but they actually do not
/// write any code to the screen.
Class WebTerminal.Core Extends Common [ Not ProcedureBlock ]
{

/// Write and read redirects used when redirecting i/o.
/// Each of the redirects signals to $ZPARENT process the $LISTBUILD string.
/// There is several actions defined in the WebTerminal.Engine handler class for received list.
/// "o" is for output. Resulting with $lb("o", {string})
/// "r" is for reading string. Resulting with $lb("r", {length}, {timeout})
/// "rc" is for reading char. Resulting with $lb("rc", {timeout})
/// "end" symbolizes that execution end is reached. Resulting with $lb("end", {error message})
Method redirects() [ Private, ProcedureBlock = 0 ]
{
wstr(str)
	do ##class(%Device).ReDirectIO($$$NO)
	write str
	do ##class(%Device).ReDirectIO($$$YES)
    quit ##class(WebTerminal.Common).SendChunk($ZPARENT, "o", str)

wchr(c)
	do ##class(%Device).ReDirectIO($$$NO)
	write $CHAR(c)
	do ##class(%Device).ReDirectIO($$$YES)
    quit ##class(WebTerminal.Common).SendChunk($ZPARENT, "o", $CHAR(c))

wnl
	do ##class(%Device).ReDirectIO($$$NO)
	write !
	do ##class(%Device).ReDirectIO($$$YES)
    quit ##class(WebTerminal.Common).SendChunk($ZPARENT, "o", $CHAR(13, 10))

wff
	do ##class(%Device).ReDirectIO($$$NO)
	set $X = 0
	set $Y = 0
	do ##class(%Device).ReDirectIO($$$YES)
    quit ##class(WebTerminal.Common).SendChunk($ZPARENT, "o", $CHAR(12))

wtab(s)
	do ##class(%Device).ReDirectIO($$$NO)
	set $x = s
	do ##class(%Device).ReDirectIO($$$YES)
    quit ##class(WebTerminal.Common).SendChunk($ZPARENT, "o", $CHAR(27) _ "[" _ (s + 1) _ "G")

rstr(length = 32656, timeout = 86400)
    do ##class(WebTerminal.Common).SendChunk($ZPARENT, "r", $lb(length, timeout))
    quit $LISTGET(##class(WebTerminal.Common).ReceiveChunk(), 2)

rchr(timeout = 86400)
    do ##class(WebTerminal.Common).SendChunk($ZPARENT, "c", timeout)
    quit $LISTGET(##class(WebTerminal.Common).ReceiveChunk(), 2)
}

ClassMethod VarList() As %String [ ProcedureBlock = 1 ]
{
    if $data(%)
    new % set %=$select($test:$LISTBUILD("%"),1:"")
    set:$data(%0) %=%_$LISTBUILD("%0")
    new %0 set %0="%0"
    for {
        set %0=$ORDER(@%0)
        quit:%0=""
        set %=%_$LISTBUILD(%0, $IsObject(@%0), @%0)
    }
    return %
}

/// Retrieves a command text from the parent process.
/// Terminates itself if the parent process is dead.
ClassMethod WaitCommand() As %String [ ProcedureBlock = 1 ]
{
    for {
        set data = ..ReceiveChunk()
        set flag = $LISTGET(data, 1)
        if (flag = "m") { // message
            return $LISTGET(data, 2)
        } elseif (flag = "a") { // autocomplete
            do ##class(WebTerminal.Common).SendChunk($ZPARENT, "a", ..VarList())
        } else { // end or unexpected
            do $system.Process.Terminate($JOB, 2)
            return ""
        }
    }
}

/// Starts new terminal loop. Must be called with JOB command.
ClassMethod Loop(StartupRoutine As %String = "") As %Status
{
	if ($ZPARENT = 0) {
        write "This method is for JOB use only."
        return 0
    }
    open "terminal"::"^%X364"
    use $io::"^" _ $ZName
    if (StartupRoutine '= "") {
        do ##class(%Device).ReDirectIO($$$YES)
        try {
            do @StartupRoutine
            do ##class(%Device).ReDirectIO($$$NO)
        } catch {
            do ##class(%Device).ReDirectIO($$$NO)
            do ..SendChunk($ZPARENT, "e", $LISTBUILD($NAMESPACE, $ZERROR))
        }
        do ..SendChunk($ZPARENT, "e", $LISTBUILD($NAMESPACE, ""))
        return $$$OK
    }
    kill // kill any temporary variables ProcedureBlock may have
    for {
        do ##class(%Device).ReDirectIO($$$YES)
        set $ZERROR = ""
        try { xecute ..WaitCommand() } catch {}
        do ##class(%Device).ReDirectIO($$$NO)
        write !! // assume that prompt takes 2 lines
        do ..SendChunk($ZPARENT, "e", $LISTBUILD($NAMESPACE, $ZERROR))
    }
    return $$$OK
}

}
