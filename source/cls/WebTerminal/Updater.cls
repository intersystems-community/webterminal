/// <!-- @echo package.title --> version <!-- @echo package.version --> update module class.
/// This class represents update mechanism for WebTerminal. Internet connection is required to
/// update WebTerminal.
Class WebTerminal.Updater
{

/// SSL configuration name used for HTTPS requests.
Parameter SSLConfigName = "WebTerminalSSL";

ClassMethod GetSSLConfigurationName () As %String
{
    new $namespace
    zn "%SYS"
    if ('##class(Security.SSLConfigs).Exists(..#SSLConfigName)) {
        set st = ##class(Security.SSLConfigs).Create(..#SSLConfigName)
        return:(st '= 1) "UnableToCreateSSLConfig:"_$System.Status.GetErrorText(st)
    }
    return ..#SSLConfigName
}

ClassMethod Update (client As WebTerminal.Engine, URL As %String) As %Status
{
    do client.Send("oLocalized", "%sUpdSt"_$CHAR(13, 10))
    set request = ##class(%Net.HttpRequest).%New()
    set request.Server = $PIECE(URL, "/", 3)
    set request.Location = $PIECE(URL, "/", 4, *)
    set request.Https = 1
    set request.SSLConfiguration = ..GetSSLConfigurationName()
    do client.Send("oLocalized", "%sUpdRURL(https://"_request.Server_"/"_request.Location_")"_$CHAR(13, 10))
    set status = request.Get()
    do client.Send("oLocalized", "%sUpdGetOK"_$CHAR(13, 10))
    return:(status '= $$$OK) status

    if (request.HttpResponse.StatusCode '= 200) {
        do client.Send("oLocalized", "%sUpdSCode("_request.HttpResponse.StatusCode_")"_$CHAR(13, 10))
        return $$$ERROR($$$GeneralError, "HTTP "_request.HttpResponse.StatusCode)
    }

    do client.Send("oLocalized", "%sUpdWTF"_$CHAR(13, 10))
    set tempFile = ##class(%File).TempFilename("xml")
    set file = ##class(%File).%New(tempFile)
    do file.Open("NW")
    set data = request.HttpResponse.Data
    if (($IsObject(data)) && (data.%IsA("%Stream.Object"))) {
        while 'data.AtEnd {
            set chunk = data.Read(data.Size)
            do file.Write(chunk)
        }
    } else {
        do file.Write(data)
    }
    do file.Close()

    do client.Send("oLocalized", "%sUpdLoad"_$CHAR(13, 10))

    set logFile = ##class(%File).TempFilename("txt")
    open logFile:("NRW"):5
    set io = $IO
    use logFile
    set loadStatus = $SYSTEM.OBJ.Load(tempFile, "c")
    close logFile
    use io

    if ##class(%File).Exists(logFile) {
        set stream = ##class(%Stream.FileCharacter).%New()
        set sc = stream.LinkToFile(logFile)
        while 'stream.AtEnd {
            do client.Send("o", stream.Read()_$CHAR(13, 10))
        }
        do client.Send("oLocalized", "%sUpdCleanLog("_logFile_")"_$CHAR(13, 10))
        do ##class(%File).Delete(logFile)
    }

    do client.Send("oLocalized", "%sUpdClean("_tempFile_")"_$CHAR(13, 10))
    do ##class(%File).Delete(tempFile)
    do client.Send("oLocalized", "%sUpdDone"_$CHAR(13, 10))

    return $$$OK
}

}