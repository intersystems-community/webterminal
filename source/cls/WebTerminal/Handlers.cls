/// <!-- @echo package.title --> version <!-- @echo package.version --> WebSocket handlers class.
/// This class describes handlers for WebSocket client. Each handler method takes WS client instance
/// as a first argument, and a given data as second. For example, handler for "execute"
/// command will be names as "HandleExecute". Note that all the processing is synchronous and it
/// blocks the WebSocket input while processing.
/// This class is inherited by WebTerminal.Engine class.
/// Methods must return positive status or an error if one happened.
Class WebTerminal.Handlers
{

/// data can be either string or %ZEN.proxyObject. In case of proxyObject, the command is hold in
/// data.command property, and it may have some other control properties.
ClassMethod Execute (client As WebTerminal.Engine, data) As %Status
{
    if $IsObject(data) {
        set command = data.command
        if (data.echo = 0) {
            set client.echo = 0
        }
    } else {
        set command = data
    }
    do client.Send("o", $CHAR(13, 10))
    do client.SendChunk(client.corePID, "m", command)
    for {
        set message = client.ReceiveChunk()
        set flag = $LISTGET(message, 1)
        set chunk = $LISTGET(message, 2)
        if (flag = "o") {
            do client.Send("o", chunk)
        } elseif (flag = "r") {
            set obj = ##class(%ZEN.proxyObject).%New()
            set obj.length = $LISTGET(chunk, 1)
            set obj.timeout = $LISTGET(chunk, 2)
            do client.Send("readString", obj)
            do client.SendChunk(client.corePID, "m", client.GetMessage().d)
        } elseif (flag = "c") {
            set obj = ##class(%ZEN.proxyObject).%New()
            set obj.timeout = chunk
            do client.Send("readChar", obj)
            do client.SendChunk(client.corePID, "m", client.GetMessage().d)
        } elseif (flag = "e") {
            set client.childNamespace = $LISTGET(chunk, 1)
            set err = $LISTGET(chunk, 2)
            if (err '= "") {
                do client.Send("execError", err)
            }
            quit // break for cycle
        } else { // unknown response - just send it to the client
            do client.Send("o", chunk)
        }
    }
    do client.Send("o", $CHAR(13, 10))
    if $IsObject(data) {
        if (data.echo = 0) {
            set client.echo = 1
        }
    }
    do:('($IsObject(data) && (data.prompt = 0))) client.Send("prompt", client.childNamespace)
    return $$$OK
}

ClassMethod Update (client As WebTerminal.Engine, URL As %String)
{
    return ##class(WebTerminal.Updater).Update(client, URL)
}

ClassMethod LocalAutocomplete(client As WebTerminal.Engine, data)
{
	do client.SendChunk(client.corePID, "a")
	set list = $LISTGET(client.ReceiveChunk(), 2)
	set obj = ##class(%ZEN.proxyObject).%New()
	for i=3:3:$LISTLENGTH(list) {
		set obj2 = ##class(%ZEN.proxyObject).%New()
		set obj2.isOref = $LISTGET(list, i - 1)
		set obj2.value = $LISTGET(list, i)
		set $PROPERTY(obj, $LISTGET(list, i - 2)) = obj2
	}
    do client.Send("ac", obj)
	return $$$OK
}

ClassMethod GlobalAutocomplete (client As WebTerminal.Engine, part As %String) As %Status
{
    do client.Send(, ##class(WebTerminal.Autocomplete).GetGlobals(client.childNamespace, part))
    return $$$OK
}

ClassMethod ClassAutocomplete (client As WebTerminal.Engine, part As %String) As %Status
{
    do client.Send(, ##class(WebTerminal.Autocomplete).GetClass(client.childNamespace, part))
    return $$$OK
}

ClassMethod RoutineAutocomplete (client As WebTerminal.Engine, part As %String) As %Status
{
    do client.Send(, ##class(WebTerminal.Autocomplete).GetRoutines(client.childNamespace, part))
    return $$$OK
}

ClassMethod ClassMemberAutocomplete (client As WebTerminal.Engine, data As %ZEN.proxyObject) As %Status
{
    do client.Send(, ##class(WebTerminal.Autocomplete).GetPublicClassMembers(client.childNamespace, data.className, data.part))
    return $$$OK
}

ClassMethod MemberAutocomplete (client As WebTerminal.Engine, data As %ZEN.proxyObject) As %Status
{
    do client.SendChunk(client.corePID, "a")
    set list = $LISTGET(client.ReceiveChunk(), 2)
    set isOref = 0
    set value = ""
    for i=3:3:$LISTLENGTH(list) {
        if $LISTGET(list, i - 2) = data.variable {
            set isOref = $LISTGET(list, i - 1)
            set value = $LISTGET(list, i)
            quit
        }
    }
    if isOref {
        do client.Send(, ##class(WebTerminal.Autocomplete).GetClassMembers(
            client.childNamespace, $PIECE(value, "@", 2), data.part, data.methodsOnly
        ))
    } else {
        do client.Send(, 0)
    }
    return $$$OK
}

ClassMethod ParameterAutocomplete (client As WebTerminal.Engine, data As %ZEN.proxyObject) As %Status
{
    do client.Send(, ##class(WebTerminal.Autocomplete).GetParameters(client.childNamespace, data.className, data.part))
    return $$$OK
}

ClassMethod serverNameConfigSet (client As WebTerminal.Engine, value As %String = "") As %Status
{
    set ^WebTerminal("Name") = value
    do client.Send(, 1)
    return $$$OK
}

}