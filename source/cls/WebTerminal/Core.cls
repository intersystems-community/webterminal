Class WebTerminal.Core [ Not ProcedureBlock ]
{

/// Write and read redirects used when redirecting i/o
Method redirects() [ Private, ProcedureBlock = 0 ]
{
WriteMessage(data)
	do $system.Event.Signal($ZPARENT, ":"_data)
	quit
wstr(s)
    do WriteMessage(s)
    quit

wchr(c)
    do WriteMessage($c(c))
    quit

wnl
    do WriteMessage($c(13, 10))
    quit

wff
    do WriteMessage($c(12)) // clrscr
    quit

wtab(s)
    do WriteMessage($C(27) _ "[" _ (s + 1) _ "G")
    quit

rstr(len = 32656, timeout = 86400)
    do $system.Event.Signal($ZPARENT, "read:str::"_timeout_":"_len)
    quit $LISTGET($system.Event.WaitMsg(), 2)

rchr(timeout = 86400)
    do $system.Event.Signal($ZPARENT, "read:char:"_timeout)
    quit $LISTGET($system.Event.WaitMsg(), 2)
}

/// Starts new terminal loop
ClassMethod Loop() As %Status
{
	if ($ZPARENT = 0) {
		write "This method is for JOB use only."
		return 0
	}
	open "terminal"::"^%X364"
	use $io::"^" _ $ZName
	for {
	    set message = $LISTGET($system.Event.WaitMsg(), 2)
	    //set ^test = "message arrived: "_message
	    //do $system.Event.Signal($ZPARENT, "Start executing the "_message_$C(13,10))
	    //set ^test = "back signal send: "_message

	    do ##class(%Device).ReDirectIO($$$YES)
	    set $ZERROR = ""
    	try { xecute message } catch exception {
        	set $ZERROR = exception.DisplayString()
    	}
    	if ($ZERROR '= "") {
        	write $ZERROR, *-3
    	}
    	do ##class(%Device).ReDirectIO($$$NO)

	    do $system.Event.Signal($ZPARENT, "fin:")
	}
	quit $$$OK
}

}