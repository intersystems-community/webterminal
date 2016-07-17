/// <!-- @echo package.title --> version <!-- @echo package.version --> core.
/// Class which handles client requests and executes code.
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
    quit ##class(WebTerminal.Common).SendChunk($ZPARENT, "o", str)

wchr(c)
    quit ##class(WebTerminal.Common).SendChunk($ZPARENT, "o", $CHAR(c))
    quit

wnl
    quit ##class(WebTerminal.Common).SendChunk($ZPARENT, "o", $CHAR(13, 10))
    quit

wff
    quit ##class(WebTerminal.Common).SendChunk($ZPARENT, "o", $CHAR(12))
    quit

wtab(s)
    quit ##class(WebTerminal.Common).SendChunk($ZPARENT, "o", $CHAR(27) _ "[" _ (s + 1) _ "G")
    quit

rstr(length = 32656, timeout = 86400)
    quit ##class(WebTerminal.Common).SendChunk($ZPARENT, "r", $lb(length, timeout))
    quit $LISTGET(##class(WebTerminal.Common).ReceiveChunk(), 2)

rchr(timeout = 86400)
    quit ##class(WebTerminal.Common).SendChunk($ZPARENT, "c", timeout)
    quit $LISTGET(##class(WebTerminal.Common).ReceiveChunk(), 2)
}

/// Retrieves a command text from the parent process.
/// Terminates itself if the parent process is dead.
ClassMethod WaitCommand() As %String [ ProcedureBlock = 1 ]
{
    set data = ..ReceiveChunk()
    set flag = $LISTGET(data, 1)
    if (flag = "m") {
        return $LISTGET(data, 2)
    } else { // end or unexpected
        do $system.Process.Terminate($JOB, 2)
        return ""
    }
}

/// Starts new terminal loop. Must be called with JOB command.
ClassMethod Loop() As %Status
{
	if ($ZPARENT = 0) {
		write "This method is for JOB use only."
		return 0
	}
	open "terminal"::"^%X364"
	use $io::"^" _ $ZName
	kill // kill any temporary variables ProcedureBlock may have
	for {
	    do ##class(%Device).ReDirectIO($$$YES)
	    set $ZERROR = ""
    	try { xecute ..WaitCommand() } catch exception {}
    	do ##class(%Device).ReDirectIO($$$NO)
	    do ..SendChunk($ZPARENT, "e", $LISTBUILD($NAMESPACE, $ZERROR))
	}
	quit $$$OK
}

}