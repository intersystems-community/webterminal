/// Importing this class will install Cache WEB Terminal properly.
Class WebTerminal.Installer Extends %Projection.AbstractProjection [ DependsOn = Router ]
{

Parameter DispatchClass = "WebTerminal.Router";

Parameter ResourceName = "%WebTerminal";

Parameter RoleName = "WebTerminal";

Projection Reference As Installer;

Parameter VERSION = "<!-- @echo package.version -->";

/// In older Cache versions, method "GetISCProduct" does not exists
Parameter iscProductVersion = {$case(
        ##class(%Dictionary.CompiledMethod).IDKEYExists("%SYSTEM.Version", "GetISCProduct"),
        1: $CLASSMETHOD("%SYSTEM.Version", "GetISCProduct"),
        : 2
    )};

ClassMethod RegisterWebApplication(name As %String, spec) As %Status
{
    new $Namespace
    set $Namespace = "%SYS"
    set st = $$$OK
    if ('##class(Security.Applications).Exists(name)) {
        write !,"Creating WEB application """_name_"""..."
        set st = ##class(Security.Applications).Create(name, .spec)
        write !, "WEB application """_name_""" is created."
    } else { // ensure configuration matches in case of updating from old terminal versions
        write !, "Updating web application """_name_"""..."
        set st = ##class(Security.Applications).Modify(name, .spec)
        write !, "WEB application """_name_""" is updated."
    }
    return st
}

ClassMethod RemoveWebApplication(name As %String)
{
    new $Namespace
    set $Namespace = "%SYS"
    set st = $$$OK
    if (##class(Security.Applications).Exists(name)) {
        do ##class(Security.Applications).Get(name, .props)
        if (props("DispatchClass") '= ..#DispatchClass) && (name = "/terminal") {
            write !, "Won't delete WEB-application """_name_""" because it does not refer to dispatch class anymore."
        } else {
            write !, "Deleting WEB application """_name_"""..."
            set st = ##class(Security.Applications).Delete(name)
            write !, "WEB application """_name_""" was successfully deleted."
        }
    }
    return st
}

ClassMethod ReportInstallStatus(st, ns = {^WebTerminal("HomeNamespace")}) As %Status
{
    set $Namespace = ns
    if (st '= 1) {
        do $System.Status.DisplayError(st)
    }
    set status = ##class(WebTerminal.Analytics).ReportInstallStatus(st)
    set $Namespace = "%SYS"
    return status
}

/// This method is invoked when a class is compiled.
ClassMethod CreateProjection(cls As %String, ByRef params) As %Status
{
	new $Namespace
	set ns = $Namespace // ought to be package home namespace!
    set ^WebTerminal("HomeNamespace") = ns
    set ^WebTerminal("FirstLaunch") = 1
    write !, "Installing WebTerminal application to " _ ns
    set dbdir = $$$defdir
    try {
        set $Namespace = "%SYS"
    } catch (e) {
        set mes = "<PROTECT> The user " _ $Username _ " has no privileges"
            _ " to enter the %SYS namespace. Please, log in as a privileged user"
            _ " to set up the WebTerminal application."
        set err = $$$ERROR($$$GeneralError, mes)
        do ..ReportInstallStatus(err, ns)
        return err
    }
    
    set cspProperties("AutheEnabled") = $$$AutheCache
    set cspProperties("NameSpace") = ns
    set cspProperties("Description") = "A WEB application for Cache WEB Terminal."
    set cspProperties("IsNameSpaceDefault") = $$$NO
    set cspProperties("DispatchClass") = ..#DispatchClass
    set st = ..RegisterWebApplication("/terminal", .cspProperties)
    do:($$$ISERR(st)) ..ReportInstallStatus(st, ns)
    return:$$$ISERR(st) st
    
    set cspProperties("AutheEnabled") = $$$AutheUnauthenticated
    set cspProperties("Description") = "An application representing the open socket for /terminal application."
    set cspProperties("DispatchClass") = ""

    set requiredRole = $case(..#iscProductVersion >= 4, 1: "%DB_IRISSYS", : "%DB_CACHESYS")
    set roles = ..GetDBRole(dbdir)
    set extractedRoles = $case($get(roles) '= "", 1: ":" _ roles, : "")
    set cspProperties("MatchRoles") = ":" _ $case(
        $find(extractedRoles, requiredRole) = 0,
        1: requiredRole _ extractedRoles,
        : requiredRole
    )
    write !, "Assigning role " _ requiredRole _ " to a web application; resulting roles: " _ cspProperties("MatchRoles")

    set st = ..RegisterWebApplication("/terminalsocket", .cspProperties)
    do:($$$ISERR(st)) ..ReportInstallStatus(st, ns)
    return:$$$ISERR(st) st
    
    do ..CreateAllNamespace()
    
    write !, "Mapping %WebTerminal package into all namespaces:"
    set st = ..Map(ns)
    if ($$$ISERR(st)) {
        do ..ReportInstallStatus(st, ns)
    } else {
	    write !, "WebTerminal package successfully mapped into all namespaces."
	    do ..ReportInstallStatus(1, ns)
    }

    if (##class(Security.Resources).Exists(..#ResourceName) = 0) {
        set st = ##class(Security.Resources).Create(..#ResourceName,
            "Grants access to WebTerminal if set up.", "")
    }

    if (##class(Security.Roles).Exists(..#RoleName) = 0) {
        set st = ##class(Security.Roles).Create(..#RoleName,
            "WebTerminal user role which may grant access to WebTerminal application if set up.",
            "%WebTerminal:RWU")
    }
    
    return st
}

/// This method is invoked when a class is 'uncompiled'.
ClassMethod RemoveProjection(cls As %String, ByRef params, recompile As %Boolean) As %Status
{
	new $Namespace

	write:(recompile) !, "Recompiling WebTerminal, skipping the deletion..."
    return:(recompile) $$$OK

	set ns = $get(^WebTerminal("HomeNamespace"), $Namespace)
    write !, "Uninstalling WebTerminal application from ", ns
    zn "%SYS"
    set st = ..RemoveWebApplication("/terminal")
    do:($$$ISERR(st)) ..ReportInstallStatus(st, ns)
    return:($$$ISERR(st)) st
    set st = ..RemoveWebApplication("/terminalsocket")
    do:($$$ISERR(st)) ..ReportInstallStatus(st, ns)
    return:($$$ISERR(st)) st
    if (##class(Security.Resources).Exists(..#ResourceName) = 1) {
        set st = ##class(Security.Resources).Delete(..#ResourceName)
        do:($$$ISERR(st)) ..ReportInstallStatus(st, ns)
        return:($$$ISERR(st)) st
    }
    if (##class(Security.Roles).Exists(..#RoleName) = 1) {
        set st = ##class(Security.Roles).Delete(..#RoleName)
        do:($$$ISERR(st)) ..ReportInstallStatus(st, ns)
        return:($$$ISERR(st)) st
    }

    kill:st ^WebTerminal
    write !, "Global ^WebTerminal removed."

    write !, "Unmapping %WebTerminal package from all namespaces:"
	set st = ..UnMap(ns)
    if ($$$ISERR(st)) {
        do ..ReportInstallStatus(st, ns)
    } else {
	    write !, "Unmapping complete."
    }

    return st
}

ClassMethod GetDBRole(directory As %String) As %String
{
	return:'$d(directory) ""
	new $Namespace
	set $Namespace = "%SYS"
	#dim db As SYS.Database
	set db = ##class(SYS.Database).%OpenId(directory)
	if $Isobject(db) {
		set resource = db.ResourceName
		set role = resource // I'm assuming that default role exists (@eduard93)
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

        set dbPrefix = $case(..#iscProductVersion >= 4, 1: "IRIS", : "CACHE")
        set Properties("Globals") = dbPrefix _ "TEMP"
        set Properties("Library") = dbPrefix _ "LIB"
        set Properties("Routines") = dbPrefix _ "TEMP"
        set Properties("SysGlobals") = dbPrefix _ "SYS"
        set Properties("SysRoutines") = dbPrefix _ "SYS"
        set Properties("TempGlobals") = dbPrefix _ "TEMP"
		
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
        continue:('##Class(Config.Namespaces).Exists(namespace))
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
	    continue:('##Class(Config.Namespaces).Exists(namespace))
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
