/// The REST interface: class that routes HTTP requests
Class WebTerminal.Router Extends %CSP.REST [ CompileAfter = StaticContent ]
{

XData UrlMap
{
<Routes>
   <Route Url="/" Method="GET" Call="Index"/>
   <Route Url="/index" Method="GET" Call="Index"/>
   <Route Url="/auth" Method="GET" Call="Auth"/>
   <Route Url="/css/index.css" Method="GET" Call="GetCss"/>
   <Route Url="/css/themes/:theme" Method="GET" Call="GetTheme"/>
   <Route Url="/js/index.js" Method="GET" Call="GetJs"/>
</Routes>
}

/// Calls StaticContent.Write method or sends not modified header. Type have to be "css" or "js"
ClassMethod WriteStatic(type As %String, ContentType As %String = "") [ Private ]
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

    if (%request.GetCgiEnv("HTTP_IF_MODIFIED_SINCE")=$$$CompileTime) {
        set %response.Status = "304 Not Modified"
    } else {
        do ##class(StaticContent).Write(type)
    }
}

ClassMethod Auth() As %Status
{
    set cookie = $System.Encryption.Base64Encode(%session.Key)
    set ^WebTerminal("AuthUser", cookie) = $LB( // authList
        $Username, // username
        $Horolog, // granting ticket date
        $Get(%request.Data("ns", 1), $Get(%request.Data("NS", 1))),
        $Get(%request.Data("clean", 1), 0) '= 0
    )
    write "{""key"":""" _ cookie _ """}"
    return $$$OK
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
    do ..WriteStatic("Theme"_$REPLACE(Theme, ".css", ""),"text/css")
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
    do ..WriteStatic("html")
    return $$$OK
}

}
