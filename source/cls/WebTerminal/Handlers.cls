/// <!-- @echo package.title --> version <!-- @echo package.version --> WebSocket handlers class.
/// This class describes handlers for WebSocket client. Each handler method takes WS client instance
/// as a first argument, and a given data as second. For example, handler for "execute"
/// command will be names as "HandleExecute". Note that all the processing is synchronous and it
/// blocks the WebSocket input while processing.
/// This class is inherited by WebTerminal.Engine class.
/// Methods must return positive status or an error if one happened.
Class WebTerminal.Handlers
{

ClassMethod Execute (client As WebTerminal.Engine, command As %String) As %Status
{
    do client.Send("o", $CHAR(13, 10))
    do client.SendChunk(client.corePID, "m", command)
    for {
        set message = client.ReceiveChunk()
        set flag = $LISTGET(message, 1)
        set data = $LISTGET(message, 2)
        if (flag = "o") {
            do client.Send("o", data)
        } elseif (flag = "r") {
            set obj = ##class(%ZEN.proxyObject).%New()
            set obj.length = $LISTGET(data, 1)
            set obj.timeout = $LISTGET(data, 2)
            do client.Send("readString", obj)
            do client.SendChunk(client.corePID, "m", client.GetMessage().d)
        } elseif (flag = "c") {
            set obj = ##class(%ZEN.proxyObject).%New()
            set obj.timeout = data
            do client.Send("readChar", obj)
            do client.SendChunk(client.corePID, "m", client.GetMessage().d)
        } elseif (flag = "e") {
            set client.childNamespace = $LISTGET(data, 1)
            set err = $LISTGET(data, 2)
            if (err '= "") {
                do client.Send("execError", err)
            }
            quit // break for cycle
        } else { // unknown response - just send it to the client
            do client.Send("o", data)
        }
    }
    do client.Send("o", $CHAR(13, 10))
    do client.Send("prompt", client.childNamespace)
    return $$$OK
}

ClassMethod GlobalAutocomplete (client As WebTerminal.Engine, data As %ZEN.proxyObject) As %Status
{
    set obj = ##class(%ZEN.proxyObject).%New()
    set obj.for = data.for
    set obj.base = data.part
    set obj.variants = ##class(WebTerminal.Autocomplete).GetGlobals(client.childNamespace, data.part)
    do client.Send("suggest", obj)
    return $$$OK
}

ClassMethod ClassAutocomplete (client As WebTerminal.Engine, data As %ZEN.proxyObject) As %Status
{
    set obj = ##class(%ZEN.proxyObject).%New()
    set obj.for = data.for
    set obj.base = data.part
    set obj.variants = ##class(WebTerminal.Autocomplete).GetClass(client.childNamespace, data.part)
    do client.Send("suggest", obj)
    return $$$OK
}

}