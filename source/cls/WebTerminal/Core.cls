/// <!-- @echo package.title --> version <!-- @echo package.version --> core.
/// Class which handles client requests and executes code.
Class WebTerminal.Core [ Not ProcedureBlock ]
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
    do $system.Event.Signal($ZPARENT, $lb("o", str))
    quit

wchr(c)
    do $system.Event.Signal($ZPARENT, $lb("o", $CHAR(c)))
    quit

wnl
    do $system.Event.Signal($ZPARENT, $lb("o", $CHAR(13, 10)))
    quit

wff
    do $system.Event.Signal($ZPARENT, $lb("o", $CHAR(12)))
    quit

wtab(s)
    do $system.Event.Signal($ZPARENT, $lb("o", $CHAR(27) _ "[" _ (s + 1) _ "G"))
    quit

rstr(length = 32656, timeout = 86400)
    do $system.Event.Signal($ZPARENT, $lb("r", length, timeout))
    quit $LISTGET($system.Event.WaitMsg(), 2)

rchr(timeout = 86400)
    do $system.Event.Signal($ZPARENT, $lb("rc", timeout))
    quit $LISTGET($system.Event.WaitMsg(), 2)
}

/// Retrieves a command text from the parent process.
/// Terminates itself if the parent process is dead.
ClassMethod WaitCommand() As %String [ ProcedureBlock = 1 ]
{
    for {
        set message = $system.Event.WaitMsg("", 1)
        set status = $LISTGET(message, 1)
        if (status = 1) {
            quit
        }
        if (status = 0) {
            do:'$data(^$Job($ZPARENT)) $system.Process.Terminate($JOB, 1)
            continue
        }
        do $system.Process.Terminate($JOB, 1)
    }
    set data = $LISTGET(message, 2)
    set event = $LISTGET(data, 1)
    if (event = "m") {
        return $LISTGET(data, 2)
    } else { // end or unexpected
        do $system.Process.Terminate($JOB, 2)
        return ""
    }
}

/// Starts new terminal loop. Must be called with JOB command.
ClassMethod Loop() As %Status
{
    set ^pids($I(^pids)) = $JOB
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
	    do $system.Event.Signal($ZPARENT, $lb("end", $ZERROR))
	}
	quit $$$OK
}

}