/// This class includes methods which collect WebTerminal's analytics such as error and installation reports.
Class WebTerminal.Analytics
{

/// This method sends a report about installation status, including error message if any errors happened.
ClassMethod ReportInstallStatus (status As %Status = 1) As %Status
{
    set req = ##class(%Net.HttpRequest).%New()
    set req.Server = "www.google-analytics.com"
    do req.EntityBody.Write("v=1&tid=<!-- @echo package.gaID -->&cid="_##class(%SYS.System).InstanceGUID()
        _"&ds=web&an=WebTerminal&av="_##class(WebTerminal.Installer).#VERSION
        _"&t=event&aiid="_$ZCONVERT($zv, "O", "URL")_"&ec=Install&ea="
        _$case($$$ISOK(status), 1: "Success", : "Failure")_"&el="
        _$ZCONVERT($System.Status.GetErrorText(status), "O", "URL"))
    return req.Post("/collect")
}

}