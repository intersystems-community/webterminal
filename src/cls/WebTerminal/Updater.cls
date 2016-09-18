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

ClassMethod WriteAndDelete (client As WebTerminal.Engine, file As %String) As %Status
{
    if ##class(%File).Exists(file) {
        set stream = ##class(%Stream.FileCharacter).%New()
        set sc = stream.LinkToFile(file)
        while 'stream.AtEnd {
            do client.Send("o", stream.Read()_$CHAR(13, 10))
        }
        do client.Send("oLocalized", "%sUpdCleanLog("_file_")"_$CHAR(13, 10))
        do ##class(%File).Delete(file)
    } else {
        do client.Send("oLocalized", "%sUpdNoFile")
    }
    return $$$OK
}

ClassMethod Stop (client  As WebTerminal.Engine, status As %Status) As %Status
{
    if ($$$ISERR(status)) {
        do client.Send("oLocalized", "%sUpdErr("_$System.Status.GetErrorText(status)_")"_$C(13, 10))
    }
    return status
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

    set backupFile = ##class(%File).TempFilename("xml")
    do client.Send("oLocalized", "%sUpdBack("_backupFile_")"_$CHAR(13, 10))

    set logFile = ##class(%File).TempFilename("txt")
    set io = $IO

    open logFile:("NW")
    use logFile
    set exportStatus = $System.OBJ.Export("WebTerminal.*.CLS", backupFile)
    close logFile
    use io

    do ..WriteAndDelete(client, logFile)
    if ($$$ISERR(exportStatus)) {
        do ##class(WebTerminal.Analytics).ReportInstallStatus(exportStatus, "Update")
        return ..Stop(client, exportStatus)
    }
    do client.Send("oLocalized", "%sUpdRemLoad"_$CHAR(13, 10))

    open logFile:("NW")
    use logFile
    write $C(27)_"[2m"
    do $System.OBJ.DeletePackage("WebTerminal")
    write $C(27)_"[0m", !
    set loadStatus = $SYSTEM.OBJ.Load(tempFile, "c")

    // At this moment WebTerminal's code can be broken, totally changed or deleted. Do not call
    // WebTerminal's methods until terminal is restored / fully updated

    if '$$$ISOK(loadStatus) { // roll back
        write !, $C(27)_"[(wrong)m==FAILED=="_$C(27)_"[0m", !,
            $System.Status.GetErrorText(loadStatus), !, !,
            $C(27)_"[(special)m==RESTORING=="_$C(27)_"[0m", !
        do $SYSTEM.OBJ.Load(backupFile, "c")
    }

    // end

    close logFile
    use io
    do ..WriteAndDelete(client, logFile)

    do client.Send("oLocalized", "%sUpdClean("_tempFile_")"_$CHAR(13, 10))
    do ##class(%File).Delete(tempFile)
    do client.Send("oLocalized", "%sUpdClean("_backupFile_")"_$CHAR(13, 10, 13, 10))
    do ##class(%File).Delete(backupFile)
    if '$$$ISOK(loadStatus) {
        do ..Stop(client, loadStatus)
        do client.Send("oLocalized", $CHAR(13, 10)_"%sUpdRes"_$CHAR(13, 10))
    }
    do client.Send("oLocalized", "%sUpdDone"_$CHAR(13, 10))

    do ##class(WebTerminal.Analytics).ReportInstallStatus(loadStatus, "Update")

    return $$$OK

}

}