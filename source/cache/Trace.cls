Class WebTerminal.Trace Extends Common
{

/// Property is used to store watching files/globals. 
Property Watches As %List;

/// Watch position in file on global
Property WatchesCaret As %Numeric [ MultiDimensional ];

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
            do ..SendData(name, ..#ClientTrace)
            q 1
        }
    } else { // watch file
        if (##class(%File).Exists(name)) {
            set ..Watches = ..Watches _ $LISTBUILD(name)
            set file = ##class(%File).%New(name)
            set ..WatchesCaret(name,0) = file.Size // current watch cursor position
            set ..WatchesCaret(name,1) = file.DateModified
            do ..SendData(name, ..#ClientTrace)
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
        do ..SendData(name, ..#ClientStopTrace)
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

}
