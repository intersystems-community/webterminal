/// Importing this class will install Cache WEB Terminal properly.
Class WebTerminal.Installer Extends %Projection.AbstractProjection [ DependsOn = Router ]
{

Parameter DispatchClass = "WebTerminal.Router";

Parameter ResourceName = "%WebTerminal";

Parameter RoleName = "WebTerminal";

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
        do ##class(WebTerminal.Analytics).ReportInstallStatus(err)
        write !, mes
        return err
    }
    
    set cspProperties("AutheEnabled") = $$$AutheCache
    set cspProperties("NameSpace") = ns
    set cspProperties("Description") = "A WEB application for Cache WEB Terminal."
    set cspProperties("IsNameSpaceDefault") = $$$NO
    set cspProperties("DispatchClass") = ..#DispatchClass
    set st = ..RegisterWebApplication("/terminal", .cspProperties)
    do:($$$ISERR(st)) ##class(WebTerminal.Analytics).ReportInstallStatus(st)
    return:$$$ISERR(st) st
    
    set cspProperties("AutheEnabled") = $$$AutheUnauthenticated
    set cspProperties("Description") = "An application representing the open socket for /terminal application."
    set cspProperties("DispatchClass") = ""
    set role = ..GetDBRole(dbdir)
    if ($system.Version.GetISCProduct() >= 4) {
        set cspProperties("MatchRoles")=":%DB_IRISSYS" _ $case($get(role)'="", 1: ":"_role, :"")
    } else {
        set cspProperties("MatchRoles")=":%DB_CACHESYS" _ $case($get(role)'="", 1: ":"_role, :"")
    }

    set st = ..RegisterWebApplication("/terminalsocket", .cspProperties)
    do:($$$ISERR(st)) ##class(WebTerminal.Analytics).ReportInstallStatus(st)
    return:$$$ISERR(st) st
    
    do ..CreateAllNamespace()
    
    write !, "Mapping %WebTerminal package into all namespaces:"
    set st = ..Map(ns)
    if ($$$ISERR(st)) {
        do $System.Status.DisplayError(st)
        do ##class(WebTerminal.Analytics).ReportInstallStatus(st)
    } else {
	    write !, "WebTerminal package successfully mapped into all namespaces."
	    do ##class(WebTerminal.Analytics).ReportInstallStatus(1)
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
    do:($$$ISERR(st)) ##class(WebTerminal.Analytics).ReportInstallStatus(st)
    return:($$$ISERR(st)) st
    set st = ..RemoveWebApplication("/terminalsocket")
    do:($$$ISERR(st)) ##class(WebTerminal.Analytics).ReportInstallStatus(st)
    return:($$$ISERR(st)) st
    if (##class(Security.Resources).Exists(..#ResourceName) = 1) {
        set st = ##class(Security.Resources).Delete(..#ResourceName)
        do:($$$ISERR(st)) ##class(WebTerminal.Analytics).ReportInstallStatus(st)
        return:($$$ISERR(st)) st
    }
    if (##class(Security.Roles).Exists(..#RoleName) = 1) {
        set st = ##class(Security.Roles).Delete(..#RoleName)
        do:($$$ISERR(st)) ##class(WebTerminal.Analytics).ReportInstallStatus(st)
        return:($$$ISERR(st)) st
    }

    kill:st ^WebTerminal
    write !, "Global ^WebTerminal removed."

    write !, "Unmapping %WebTerminal package from all namespaces:"
	set st = ..UnMap(ns)
    if ($$$ISERR(st)) {
        do $System.Status.DisplayError(st)
        try { do ##class(WebTerminal.Analytics).ReportInstallStatus(st) } catch (e) {}
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

        if ($system.Version.GetISCProduct() >= 4) {
            set Properties("Globals") = "IRISTEMP"
            set Properties("Library") = "IRISLIB"
            set Properties("Routines") = "IRISTEMP"
            set Properties("SysGlobals") = "IRISSYS"
            set Properties("SysRoutines") = "IRISSYS"
            set Properties("TempGlobals") = "IRISTEMP"
        } else {
            set Properties("Globals") = "CACHETEMP"
            set Properties("Library") = "CACHELIB"
            set Properties("Routines") = "CACHETEMP"
            set Properties("SysGlobals") = "CACHESYS"
            set Properties("SysRoutines") = "CACHESYS"
            set Properties("TempGlobals") = "CACHETEMP"
        }
		
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
