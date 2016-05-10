/// The REST interface: class that routes HTTP requests
Class WebTerminal.Router Extends %CSP.REST [ CompileAfter = StaticContent ]
{

XData UrlMap
{
<Routes>
   <Route Url="/" Method="GET" Call="Index"/>
   <Route Url="/index" Method="GET" Call="Index"/>
   <Route Url="/css/terminal.css" Method="GET" Call="GetCss"/>
   <Route Url="/css/terminal-theme/:theme" Method="GET" Call="GetTheme"/>
   <Route Url="/js/terminal.js" Method="GET" Call="GetJs"/>
   <Route Url="/autocomplete" Method="GET" Call="WriteAutocomplete"/>
</Routes>
}

/// Method returns autocomplete data in JSON format
ClassMethod WriteAutocomplete() As %Status
{
    set namespace = %request.Get("NS", $znspace)
    set %response.CharSet = "utf-8"
    set %response.ContentType = "application/json"
    write $get(^WebTerminal("Autocomplete", namespace), "{}")
    return $$$OK
}

/// Calls StaticContent.Write method or sends not modified header. Type have to be "css" or "js"
ClassMethod WriteStatic(type As %String, Auth As %String = "", ContentType As %String = "") [ Private ]
{
    #define CompileTime ##Expression("""" _ $zd($h, 11) _ ", "_ $zdt($NOW(0), 2,1) _ " GMT""")
    set %response.CharSet = "utf-8"
    set %response.ContentType = $case(type,
        "css": "text/css",
        "js": "text/javascript",
        "html": "text/html",
        : $case(ContentType="", 1:"text/plain", :ContentType)
    )
    do %response.SetHeader("Last-Modified", $$$CompileTime)

    if (%request.GetCgiEnv("HTTP_IF_MODIFIED_SINCE")=$$$CompileTime) && (Auth = "") {
        set %response.Status = "304 Not Modified"
    } else {
        do ##class(StaticContent).Write(type, Auth)
    }
}

/// Method writes application CSS.
ClassMethod GetCss() As %Status
{
    do ..WriteStatic("css")
    return $$$OK
}

/// Method writes application theme.
ClassMethod GetTheme(Theme As %String) As %Status
{
    do ..WriteStatic("Theme"_$REPLACE(Theme, ".css", ""),,"text/css")
    return $$$OK
}

/// Method writes application JavaScript.
ClassMethod GetJs() As %Status
{
    do ..WriteStatic("js")
    return $$$OK
}

/// Method writes application HTML.
ClassMethod Index() As %Status
{
    set cookie = $System.Encryption.Base64Encode(%session.Key)
    // Put the name of authorized user in a global to authorize WebSocket WebTerminal connection
    set ^WebTerminal("AuthUser", cookie) = $LB(
        $LISTGET(%session.SecurityContext, 1), // username
        $horolog // granting ticket date
    )
    do ..WriteStatic("html", cookie)
    return $$$OK
}

}
