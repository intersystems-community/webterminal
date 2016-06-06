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

ClassMethod WaitCommand() As %String [ ProcedureBlock = 1 ]
{
    set message = $system.Event.WaitMsg()
    set ^pids($I(^pids)) = message
    if ($LISTGET(message, 1) '= 1) {
        do $system.Process.Terminate($JOB, 1)
        return ""
    }
    set data = $LISTGET(message, 2)
    set event = $LISTGET(data, 1)
    if (event = "end") {
        do $system.Process.Terminate($JOB, 1)
        return ""
    } elseif (event = "m") {
        return $LISTGET(data, 2)
    } else {
        do $system.Process.Terminate($JOB, 2)
        return ""
    }
}

/// Starts new terminal loop
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