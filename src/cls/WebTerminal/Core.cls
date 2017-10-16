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

erdx s $x=0 q
erdy s $y=0 q
APC ; Application program command
 w $c(27)_"_"
 q
BEL ; Ring the bell
 w $c(7)
 q
CBT(%1) ; Cursor backward tabulation %1 tab stops
 s %1=+$g(%1,1) w $c(27,91)_%1_"Z" s $zt="erdx",$x=$x+7\8-%1*8
 q
CCH ; Cancel character
 w $c(27)_"T"
 q
CHA(%1) ; Cursor horizontal absolute (move to column %1)
 s %1=+$g(%1,1) w $c(27,91)_%1_"G" s $zt="erdx",$x=%1-1
 q
CHT(%1) ; Cursor horizontal tabulation (forward %1 tab stops)
 s %1=+$g(%1,1) w $c(27,91)_%1_"I" s $zt="erdx",$x=$x\8+%1*8
 q
CNL(%1) ; Cursor next line (cursor down %1 lines)
 s %1=+$g(%1,1) w $c(27,91)_%1_"E" s $zt="erdy",$y=$y+%1
 q
CPL(%1) ; Cursor preceding line (cursor up %1 lines)
 s %1=+$g(%1,1) w $c(27,91)_%1_"F" s $zt="erdy",$y=$y-%1
 q
CPR ; Cursor position report (return in $KEY)
 n %1 w $c(27,91)_"6n" r %1
 q
CTC(%1,%2,%3,%4,%5,%6,%7,%8,%9) ; Cursor tabulation control
 n %i,%p s %p=""
 f %i=1:1:9 i $d(@("%"_%i)) s %p=%p_$e(";",%p'="")_@("%"_%i)
 w $c(27,91)_%p_"W"
 q
CUB(%1) ; Cursor backward %1 columns
 s %1=+$g(%1,1) w $c(27,91)_%1_"D" s $zt="erdx",$x=$x-%1
 q
CUD(%1) ; Cursor down %1 lines
 s %1=+$g(%1,1) w $c(27,91)_%1_"B" s $zt="erdy",$y=$y+%1
 q
CUF(%1) ; Cursor forward %1 columns
 s %1=+$g(%1,1) w $c(27,91)_%1_"C" s $zt="erdx",$x=$x+%1
 q
CUP(%2,%1) ; Cursor position (column %1, line %2)
 s %1=+$g(%1,1),%2=+$g(%2,1) w $c(27,91)_%2_";"_%1_"H"
 s $zt="ecup",$x=%1-1,$zt="erdy",$y=%2-1 q
ecup s $x=0,$zt="erdy",$y=%2-1
 q
CUU(%1) ; Cursor up %1 lines
 s %1=+$g(%1,1) w $c(27,91)_%1_"A" s $zt="erdy",$y=$y-%1
 q
CVT(%1) ; Cursor vertical tabulation
 w $c(27,91)_+$g(%1,1)_"Y"
 q
DA ; Device attributes - return in $KEY
 n %1,%2,%3 s %3="" u $i:("":"+S")
 w $c(27,91)_"c" r %1 s %2=$k f  r *%1 s %3=%3_$c(%1) q:%1=99
 s $k=%2_%3 u $i:("":"-S")
 q
DAQ(%1,%2,%3,%4,%5,%6,%7,%8,%9) ; Define area qualification
 n %i,%p s %p=""
 f %i=1:1:9 i $d(@("%"_%i)) s %p=%p_$e(";",%p'="")_@("%"_i)
 w $c(27,91)_%p_"o"
 q
DCH(%1) ; Delete %1 characters
 w $c(27,91)_+$g(%1,1)_"P"
 q
DCS ; Device control string
 w $c(27)_"P"
 q
DL(%1) ; Delete %1 lines
 w $c(27,91)_+$g(%1,1)_"M"
 q
DMI ; Disable manual input
 q
DSR(%1) ; Device status report - type %1 - return in $KEY
 n %2 w $c(27,91)_+$g(%1,5)_"n" r %2
 q
EA(%1) ; Erase in area
 w $c(27,91)_+$g(%1,1)_"O"
 q
ECH(%1) ; Erase %1 characters
 w $c(27,91)_+$g(%1,1)_"X"
 q
ED(%1) ; Erase in display (%1=0 cursor-to-end,1 begin-to-cursor,2 entire scr)
 w $c(27,91)_+$g(%1)_"J"
 q
EF(%1) ; Erase in field
 w $c(27,91)_+$g(%1,1)_"N"
 q
EL(%1) ; Erase in line (%1=0 cursor-to-end, 1 begin-to-cursor, 2 entire line)
 w $c(27,91)_+$g(%1)_"K"
 q
EMI ; Enable manual input
 q
EPA ; End of protected area
 w $c(27)_"W"
 q
ESA ; End of selected area
 w $c(27)_"G"
 q
FNT ; Font selection
 q
GSM ; Graphic size modification
 q
GSS ; Graphic size selection
 q
HPA(%1) ; Horizontal position attribute (cursor to column %1)
 s %1=+$g(%1,1) w $c(27,91)_%1_"`" s $zt="erdx",$x=%1-1
 q
HPR(%1) ; Horizontal position relative (cursor forward %1 columns)
 s %1=+$g(%1,1) w $c(27,91)_%1_"a" s $zt="erdx",$x=$x+%1
 q
HTJ ; Horizontal tab with justify
 w $c(27)_"I"
 q
HTS ; Horizontal tabulation set
 w $c(27)_"H"
 q
HVP(%1,%2) ; Horizontal and vertical position (column %1, line %2)
 s %1=+$g(%1,1),%2=+$g(%2,1) w $c(27,91)_%2_";"_%1_"f"
 s $zt="ehvp",$x=%1-1,$zt="erdy",$y=%2-1 q
ehvp s $x=0,$zt="erdy",$y=%2-1
 q
ICH(%1) ; Insert %1 characters
 w $c(27,91)_+$g(%1,1)_"@"
 q
IL(%1) ; Insert %1 lines
 w $c(27,91)_+$g(%1,1),"L"
 q
IND ; Index
 w $c(27)_"D" s $y=$y+1
 q
INT ; Interrupt
 w $c(27,91)_"a"
 q
JFY ; Justify
 q
MC ; Media copy
 w $c(27,91)_"i"
 q
MW ; Message waiting
 w $c(27)_"U"
 q
NEL ; Next line
 w $c(27)_"E" s $x=0,$y=$y+1
 q
NP(%1) ; Next page (advance %1 pages of terminal display memory)
 w $c(27,91)_+$g(%1,1)_"U"
 q
OSC ; Operating system command
 w $c(27)_"]"
 q
PLD ; Partial line down
 w $c(27)_"K"
 q
PLU ; Partial line up
 w $c(27)_"L"
 q
PM ; Privacy message
 w $c(27)_"^"
 q
PP(%1) ; Preceding page (backup %1 pages of terminal display memory)
 w $c(27,91)_+$g(%1,1)_"V"
 q
PU1 ; Private use one
 w $c(27)_"Q"
 q
PU2 ; Private use two
 w $c(27)_"R"
 q
QUAD ; QUAD
 q
REP ; Repeat
 w $c(27,91)_"b"
 q
RI ; Reverse index
 w $c(27)_"M" s $zt="erdy",$y=$y-1
 q
RIS ; Reset to initial state
 w $c(27)_"c" s $x=0,$y=0
 q
RM(%1,%2,%3,%4,%5,%6,%7,%8,%9) ; Reset mode
 n %i,%p s %p=""
 f %i=1:1:9 i $d(@("%"_%i)) s %p=%p_$e(";",%p'="")_@("%"_%i)
 w $c(27,91)_%p_"l"
 q
SEM ; Select editing extent mode
 w $c(27,91)_"Q"
 q
SGR(%1,%2,%3,%4,%5,%6,%7,%8,%9)  ; Select graphic rendition %1 thru %9
 n %i,%p s %p=""
 f %i=1:1:9 i $d(@("%"_%i)) s %p=%p_$e(";",%p'="")_@("%"_%i)
 w $c(27,91)_%p_"m"
 q
SL ; Scroll left
 q
SM(%1,%2,%3,%4,%5,%6,%7,%8,%9) ; Set mode
 n %i,%p s %p=""
 f %i=1:1:9 i $d(@("%"_%i)) s %p=%p_$e(";",%p'="")_@("%"_%i)
 w $c(27,91)_%p_"h"
 q
SPA ; Start of protected area
 w $c(27)_"V"
 q
SPI ; Spacing increment
 q
SR ; Scroll right
 q
SS2 ; Single shift two
 w $c(27)_"N"
 q
SS3 ; Single shift three
 w $c(27)_"O"
 q
SSA ; Start of selected area
 w $c(27)_"F"
 q
ST ; String terminator
 w $c(27)_"\"
 q
STS ; Set transmit state
 w $c(27)_"S"
 q
SU ; Scroll up
 w $c(27,91)_"S"
 q
TBC ; Tabulation clear
 w $c(27,91)_"g"
 q
TSS ; Thin space specification
 q
VPA(%1) ; Vertical position attribute (move to row %1 at same column)
 s %1=+$g(%1,1) w $c(27,91)_%1_"d" s $zt="erdy",$y=%1-1
 q
VPR(%1) ; Vertical position relative (move down %1 lines at same column)
 s %1=+$g(%1,1) w $c(27,91)_%1_"e" s $zt="erdy",$y=$y+%1
 q
VTS ; Vertical tabulation sets
 w $c(27)_"J"
 q
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
ClassMethod Loop(startupRoutine As %String = "") As %Status
{
	if ($ZPARENT = 0) {
        write "This method is for JOB use only."
        return 0
    }
    open "terminal"::"^%X364"
    use $io::"^" _ $ZName
    if (startupRoutine '= "") {
        return ..StartupRoutine(startupRoutine)
    }
    kill // Kill any temporary variables ProcedureBlock may have.
    // Procedure block will hold only user-defined variables, so any declarations here may
    // potentially influence user experience. Do not add any set expressions in this procedure block
    for {
        do ..StartExecMode()
        try {
            xecute ..WaitCommand()
        } catch {
            do ..EndExecMode($ZERROR)
            continue
        }
        do ..EndExecMode()
    }
    return $$$OK
}

ClassMethod StartupRoutine(routineName = "") As %Status
{
    do ..StartExecMode()
    try {
        do @routineName
    } catch {
        do ..EndExecMode($ZERROR)
        return $$$OK
    }
    do ..EndExecMode()
    return $$$OK
}

ClassMethod StartExecMode()
{
    write ! // Y pos shift
    do ##class(%Device).ReDirectIO($$$YES)
    do $System.Util.SetInterruptEnable($$$YES)
}

ClassMethod EndExecMode(error = "")
{
    use $io::"^" _ $ZName
    do $System.Util.SetInterruptEnable($$$NO)
    do ##class(%Device).ReDirectIO($$$NO)
    write ! // Y pos shift
    do ..SendChunk($ZPARENT, "e", $LISTBUILD($NAMESPACE, error))
}

}
