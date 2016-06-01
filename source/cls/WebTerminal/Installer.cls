/// Importing this class will install Cache WEB Terminal properly.
Class WebTerminal.Installer Extends %Projection.AbstractProjection [ DependsOn = (Common, Engine, Router, StaticContent, Autocomplete, Trace) ]
{

Parameter DispatchClass = "WebTerminal.Router";

Projection Reference As Installer;

Parameter VERSION = "<!-- @echo package.version -->";

ClassMethod RegisterWebApplication(name As %String, spec) As %Status
{
    new $Namespace
    set $Namespace = "%SYS"
    set st = $$$OK
    if ('##class(Security.Applications).Exists(name)) {
        write !,"Creating WEB application """_name_"""..."
        set st = ##class(Security.Applications).Create(name, .spec)
        write !, "WEB application """_name_""" is created."
    } else {
        do ##class(Security.Applications).Get(name, .props)
        if (props("DispatchClass") '= ..#DispatchClass) && (name = "/terminal") {
            write !, "WARNING! WEB application """_name_""" exists but does not refer to ",
                ..#DispatchClass, ".", !,
                "Please, set correct dispatch class for this application ",
                "or create a terminal WEB-application manually."
        } else {
            write !, "WEB application """_name_""" already exists, so it should be ready to use. If not - remove this application manually and recompile."
        }
    }
    return st
}

ClassMethod RemoveWebApplication(name As %String)
{
    new $Namespace
    set $Namespace = "%SYS"
    if (##class(Security.Applications).Exists(name)) {
        do ##class(Security.Applications).Get(name, .props)
        if (props("DispatchClass") '= ..#DispatchClass) && (name = "/terminal") {
            write !, "Won't delete WEB-application """_name_""" because it does not refer to dispatch class anymore."
        } else {
            write !, "Deleting WEB application """_name_"""..."
            do ##class(Security.Applications).Delete(name)
            write !, "WEB application """_name_""" was successfully deleted."
        }
    }
}

/// This method is invoked when a class is compiled.
ClassMethod CreateProjection(cls As %String, ByRef params) As %Status
{
	new $Namespace
	set ns = $Namespace // ought to be package home namespace!
    set ^WebTerminal("HomeNamespace") = ns
    write !, "Installing WebTerminal application to " _ ns
    set dbdir = $$$defdir
    set $Namespace = "%SYS"
    
    set cspProperties("AutheEnabled") = $$$AutheCache
    set cspProperties("NameSpace") = ns
    set cspProperties("Description") = "A WEB application for Cache WEB Terminal."
    set cspProperties("IsNameSpaceDefault") = $$$NO
    set cspProperties("DispatchClass") = ..#DispatchClass
    set st = ..RegisterWebApplication("/terminal", .cspProperties)
    return:$$$ISERR(st) st
    
    set cspProperties("AutheEnabled") = $$$AutheUnauthenticated
    set cspProperties("Description") = "An application representing the open socket for /terminal application. Required since 2016.* Cache versions changed WebSocket behavior. PLEASE LEAVE THIS APPLICATION UNAUTHENTICATED, but do not worry: the socket won't accept anyone without the key."
    set cspProperties("DispatchClass") = ""
    set role = ..GetDBRole(dbdir)
    set cspProperties("MatchRoles")=":%DB_CACHESYS" _ $case($get(role)'="", 1: ":"_role, :"")
    set st = ..RegisterWebApplication("/terminalsocket", .cspProperties)
    return:$$$ISERR(st) st
    
    do ..CreateAllNamespace()
    
    write !, "Mapping %WebTerminal package into all namespaces:"
    set st = ..Map(ns)
    if ($$$ISERR(st)) {
        do $System.Status.DisplayError(st)
    } else {
	    write !, "WebTerminal package successfully mapped into all namespaces."
    }
    
    return st
}

/// This method is invoked when a class is 'uncompiled'.
ClassMethod RemoveProjection(cls As %String, ByRef params, recompile As %Boolean) As %Status
{
	new $Namespace
	
	set ns = $get(^WebTerminal("HomeNamespace"))
    set msg = "Please, set ^WebTerminal(""HomeNamespace"") global equal to " _
              "the namespace WebTerminal was installed to before uninstalling. " _ ns
    return:(ns="") $$$ERROR($$$GeneralError, msg)
    write:(recompile) !, "Recompiling WebTerminal..."
    return:(recompile) $$$OK
    write !, "Uninstalling WebTerminal application from ", ns
    zn "%SYS"
    do ..RemoveWebApplication("/terminal")
    do ..RemoveWebApplication("/terminalsocket")
    
    write !, "Unmapping %WebTerminal package from all namespaces:"
	set st = ..UnMap(ns)
    if ($$$ISERR(st)) {
        do $System.Status.DisplayError(st)
    } else {
	    write !, "Unmapping complete."
    }
    
    kill:st ^WebTerminal
    write !, "Global ^WebTerminal removed."
    return st
}

ClassMethod GetDBRole(directory As %String) As %String
{
	return:'$d(directory) ""
	new $Namespace
	set $Namespace = "%SYS"
	#dim db As SYS.Database
	set db=##class(SYS.Database).%OpenId(directory)
	if $Isobject(db) {
		set resource = db.ResourceName
		set role = resource // I'm assuming that default role exists
	} else {
		set role = ""
	}
	return role
}

ClassMethod CreateAllNamespace() As %Status
{
	new $Namespace
    set $Namespace = "%SYS"
	set ns = "%All"
	set st = $$$OK
	if ('##Class(Config.Namespaces).Exists(ns)) {
		set Properties("Globals") = "CACHETEMP"
		set Properties("Library") = "CACHELIB"
		set Properties("Routines") = "CACHETEMP"
		set Properties("SysGlobals") = "CACHESYS"
		set Properties("SysRoutines") = "CACHESYS"
		set Properties("TempGlobals") = "CACHETEMP"
		set st = ##Class(Config.Namespaces).Create(ns, .Properties)
		if ($$$ISERR(st)) {
        	do $System.Status.DisplayError(st)
    	} else {
        	write !, "%All namespace is created."
    	}
	}
	return st
}

ClassMethod Map(fromNS = "") As %Status
{
	new $Namespace
    set $Namespace = "%SYS"
    set st = $$$OK

    set mapTo = $LISTBUILD("%All", "SAMPLES", "DOCBOOK")
    do ##Class(Config.Namespaces).Get(fromNS, .InstallNSProps)
    set Properties("Database") = $get(InstallNSProps("Routines"))
    set ptr = 0
    while $LISTNEXT(mapTo, ptr, namespace) {
        continue:(fromNS = namespace)
        write " ", namespace
        if ('##Class(Config.MapPackages).Exists(namespace, "WebTerminal")) {
        	set st1 = ##Class(Config.MapPackages).Create(namespace, "WebTerminal", .Properties)
        }
        if ('##Class(Config.MapGlobals).Exists(namespace, "WebTerminal")) {
	        set st2 = ##Class(Config.MapGlobals).Create(namespace, "WebTerminal", .Properties)
        }
        set st = $$$ADDSC(st,$$$ADDSC($get(st1,$$$OK),$get(st2,$$$OK)))
    }
    return st
}

ClassMethod UnMap(fromNS As %String) As %Status
{
	new $Namespace
    set $Namespace = "%SYS"
    set st = $$$OK
    
	set mapTo = $LISTBUILD("%All", "SAMPLES", "DOCBOOK")
    set ptr = 0
    while $LISTNEXT(mapTo, ptr, namespace) {
	    continue:(fromNS = namespace)
        write " ", namespace
        if (##Class(Config.MapPackages).Exists(namespace, "WebTerminal")) {
        	set st1 = ##Class(Config.MapPackages).Delete(namespace, "WebTerminal", .Properties)
        }
        if (##Class(Config.MapGlobals).Exists(namespace, "WebTerminal")) {
	        set st2 = ##Class(Config.MapGlobals).Delete(namespace, "WebTerminal", .Properties)
        }
        set st = $$$ADDSC(st,$$$ADDSC($get(st1,$$$OK),$get(st2,$$$OK)))
    }
    return st
}

}
