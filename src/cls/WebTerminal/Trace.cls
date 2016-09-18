Class WebTerminal.Trace Extends Common
{

/// Property is used to store watching files/globals. 
Property Watches As %List;

/// Watch position in file or global
Property WatchesCaret As %Numeric [ MultiDimensional ];

/// Checks for correct watch source and sets watch target to ..Watches
/// Returns status of this operation
Method Trace(name) As %Status
{
    set s = $CHAR(0)
    set watches = s _ $LISTTOSTRING(..Watches, s) _ s
    if ($FIND(watches, s_name_s) '= 0) return 0 // if watch already defined

    if ($EXTRACT(name,1,1) = "^") { // watching global
        set g = 0
        try {
            if (($data(@name)) '= 0) set g = 1
        } catch {  }
        set $ZERROR = ""
        if (g = 1) {
            set ..Watches = ..Watches _ $LISTBUILD(name)
            set ..WatchesCaret(name, 0) = $QUERY(@name@(""), -1) // last
            set ..WatchesCaret(name, 1) = "?"
            return 1
        }
    } else { // watch file
        if (##class(%File).Exists(name)) {
            set ..Watches = ..Watches _ $LISTBUILD(name)
            set file = ##class(%File).%New(name)
            set ..WatchesCaret(name,0) = file.Size // current watch cursor position
            set ..WatchesCaret(name,1) = file.DateModified
            return 1
        }
    }

    return 0
}

/// Removes watch from watches list
/// Returns success status
Method StopTracing(name) As %Status
{
    set s = $CHAR(0)
    set watches = s _ $LISTTOSTRING(..Watches,s) _ s
    set newWatches = $REPLACE(watches, s_name_s, s)
    set ..Watches = $LISTFROMSTRING($EXTRACT(newWatches, 2, *-1), s)
    if (watches '= newWatches) {
        kill ..WatchesCaret(name)
    }
    return watches '= newWatches
}

/// Returns a list current watches
Method ListWatches() As %String
{
    set no = 0
    set s = "Watching: " _ $CHAR(10)
    while $LISTNEXT(..Watches, no, value) {
        set s = s_"(pos: "_..WatchesCaret(value,0)_
            "; mod: "_..WatchesCaret(value,1)_") "_value_$CHAR(10)
    }
    return s
}

/// Return null string if global hadn't been updated
/// This method watches only for tail of global and detects if global still alive
Method GetTraceGlobalModified(watch) As %List
{
    set data = ""
    if ($data(@watch)=0) {
        do ..StopTracing(watch)
        return $lb($C(27)_"[(wrong)m[D]"_$C(27)_"[0m", $C(13, 10))
    }
    for {
        set query = $QUERY(@..WatchesCaret(watch,0))
        quit:query=""
        set ..WatchesCaret(watch,0) = query
        set data = data _ $case(data = "", 1: "", :$CHAR(13, 10)) _ @query
    }
    return $lb($C(27)_"[(special)m[M]"_$C(27)_"[0m", data)
}

Method GetTraceFileModified(watch) As %String
{
    set file=##class(%File).%New(watch)
    set size = file.Size
    set modDate = file.DateModified
    set output = ""
    if (size < 0) { // file had been deleted
        do ..StopTracing(watch)
        return $lb($C(27)_"[(wrong)m[D]"_$C(27)_"[0m", $C(13, 10))
    }

    if (size > ..WatchesCaret(watch, 0)) {

        set stream = ##class(%Stream.FileCharacter).%New()
        set sc = stream.LinkToFile(watch)
        do stream.MoveTo(..WatchesCaret(watch, 0) + 1)
        set read = stream.Read(size - ..WatchesCaret(watch, 0))
        set output = output _ read
        set ..WatchesCaret(watch, 0) = size
        set ..WatchesCaret(watch, 1) = file.DateModified
        return $lb($C(27)_"[(constant)m[A]"_$C(27)_"[0m", output)

    } elseif ((size < ..WatchesCaret(watch, 0)) || (file.DateModified '= ..WatchesCaret(watch, 1))) {

        set output = output _ "Size change: " _ (size - ..WatchesCaret(watch, 0))
        set ..WatchesCaret(watch, 0) = size
        set ..WatchesCaret(watch, 1) = file.DateModified
        return $lb($C(27)_"[(special)m[M]"_$C(27)_"[0m", output)

    } // else file not changed

    return $lb("", "")
}

Method CheckTracing() As %String
{
    set no = 0
    set data = ""
    set overall = ""
    set watchList = ..Watches // do not remove or simplify: ..Watches can be modified
    while $LISTNEXT(watchList, no, value) {
        set global = $EXTRACT(value, 1, 1) = "^"
        if global {
            set data = ..GetTraceGlobalModified(value)
        } else {
            set data = ..GetTraceFileModified(value)
        }
        if ($LISTGET(data, 2) '= "") {
            set overall = $LISTGET(data, 1) _ " " _ $C(27) _ "[2m" _ $ZDATETIME($NOW(),1,1)
            _ $C(27) _ "[0m " _ $C(27) _ "[(" _ $case(global, 1: "global", :"string") _ ")m"
            _ value _ $C(27) _ "[0m" _ $CHAR(13, 10) _ $LISTGET(data, 2) _ $CHAR(13, 10)
        }
        set data = ""
    }
    return overall
}

}
