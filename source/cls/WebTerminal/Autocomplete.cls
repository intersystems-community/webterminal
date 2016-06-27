Class WebTerminal.Autocomplete Extends Common
{

//Method AutocompleteExists(namespace As %String) As %Boolean [ Deprecated ]
//{
//    quit $get(^WebTerminal("Autocomplete", namespace)) '= ""
//}
//
///// Generates autocomplete for namespace. Second parameter decides if
///// it will be regenerated again. But if namespace equals to "%" - generates
///// autocomplete for system classes. Make sure that autocomplete for
///// system classes generates one time and forever.
///// @param genSystem - Shows if system classes need to be generated.
//Method GenerateAutocomplete(namespace As %String, genSystem As %Boolean) As %String [ Deprecated ]
//{
//    set trueNs = $case(genSystem, 1:"%", :namespace)
//
//    do ..SendData("29", ..#ClientOutputLocalized)
//    do ..SendData(" " _ trueNs _ $C(13, 10))
//
//    if ('##class(%SYS.Namespace).Exists(namespace)) {
//        do ..SendData("30", ..#ClientOutputLocalized)
//        do ..SendData(" " _ namespace _ $C(13, 10))
//        quit $$$NOTOK
//    }
//
//    // get all classes names
//    set result = ##class(%ResultSet).%New("%Dictionary.ClassDefinition:Summary")
//    do result.Execute()
//
//    /*
//    The next COULD BE IMPROVED FOR SPEED, I believe.
//    Generates compressed JSON string of type:
//    {
//        "class": {
//            "%ClassName1": {
//                "methodName": 0,
//                "propertyName": 0,
//                "parameterName": 0,
//                ...
//            },
//            "ClassName2": {
//                ...
//            }
//        },
//        "global": {
//            "^%g1": 0,
//            "^g2": 0
//        }
//    }
//    */
//
//    do ..SendData($C(13, 10))
//    do ..SendData("32", ..#ClientOutputLocalized)
//
//    set ac = "{""class"":{" // string with autocomplete
//    set first = ""
//    set u = 1
//
//    while (result.Next()) { // forming autocomplete for each class
//
//        if (genSystem) '= ($Extract(result.Data("Name"), 1) = "%") {
//            continue
//        }
//
//        set className = result.Data("Name")
//
//        do ..SendData($C(27) _ "[30G" _ u)
//        s u = u + 1
//
//        set ac = ac _ first _ """" _ className _ """:{"
//        if (first = "") set first = ","
//
//        set cdefs = ##class(%Dictionary.ClassDefinition).%OpenId(className)
//        set ccdefs = ##class(%Dictionary.CompiledClass).%OpenId(className)
//
//        set countMethods = cdefs.Methods.Count()
//        set countParameters = cdefs.Parameters.Count()
//        set countProperties = cdefs.Properties.Count()
//        if ##class(%Dictionary.PropertyDefinition).IDKEYExists("%Dictionary.ClassDefinition","SystemMethods") {
//            set countSysMethods = ccdefs.SystemMethods.Count()
//        } else {
//            // SystemMethods does not exist for Caché versions before 2016.*
//            set countSysMethods = 0
//        }
//        set total = countMethods + countParameters + countProperties + countSysMethods
//        set current = 0
//
//        for i=1:1:countMethods {
//            set current = current + 1
//            set ac = ac _ """" _ cdefs.Methods.GetAt(i).Name _ """:0"
//            if (current'=total) set ac = ac _ ","
//        }
//
//        for i=1:1:countProperties {
//            set current = current + 1
//            set ac = ac _ """" _ cdefs.Properties.GetAt(i).Name _ """:0"
//            if (current'=total) set ac = ac _ ","
//        }
//
//        for i=1:1:countParameters {
//            set current = current + 1
//            set ac = ac _ """" _ cdefs.Parameters.GetAt(i).Name _ """:0"
//            if (current'=total) set ac = ac _ ","
//        }
//
//        for i=1:1:countSysMethods {
//            set current = current + 1
//            set ac = ac _ """$" _ ccdefs.SystemMethods.GetAt(i).Name _ """:0"
//            if (current'=total) set ac = ac _ ","
//        }
//
//        set ac = ac _ "}"
//
//    }
//
//    set ac = ac _ "}"
//    if ('genSystem) set ac = ac _ ",""global"":" _ ..getGlobalsJSON()
//    set ac = ac _ "}"
//
//    set ^WebTerminal("Autocomplete", trueNs) = ac
//
//    do ..SendData($C(13, 10))
//    do ..SendData("33", ..#ClientOutputLocalized)
//    do ..SendData($C(13, 10))
//    //do ..SendData(namespace, ..#ClientLoadAutocomplete)
//
//    quit $$$OK
//}
//
///// Returns terminal to default state
//ClassMethod Reset() As %Status
//{
//    if ('$data(^WebTerminal("HomeNamespace"))) {
//        quit $$$NOTOK
//    }
//    // delete autocompletion files
//    kill ^WebTerminal("Autocomplete")
//    quit $$$OK
//}

/// Return an array of globals names in the namespace, which begin from "beginning".
ClassMethod GetGlobals(namespace As %String = "%SYS", beginning As %String = "") As %ZEN.proxyObject
{
    set result = ##class(%ZEN.proxyObject).%New()
    set beginning = beginning _ "*"
    new $Namespace
    set $Namespace = namespace
    set rset = ##class(%ResultSet).%New("%SYS.GlobalQuery:NameSpaceList")
    do rset.Execute($Namespace, beginning, 0)
    set i = -1
    while (rset.Next()) {
        set $PROPERTY(result, $Sequence(i)) = rset.GetData(1)
    }
    quit result
}

/// Return an array of class names in the namespace, which begin from "beginning".
/// May be optimized!
ClassMethod GetClass(namespace As %String = "%SYS", beginning As %String = "") As %ZEN.proxyObject
{
    set result = ##class(%ZEN.proxyObject).%New()
    new $Namespace
    set $Namespace = namespace
    set rset = ##class(%ResultSet).%New("%Dictionary.CompiledClassQuery:Summary")
    do rset.Execute()
    set i = -1
    while (rset.Next()) {
        set r = rset.GetData(1)
        set:(($FIND(r, beginning) - $LENGTH(beginning)) = 1) $PROPERTY(result, $Sequence(i)) = r
    }
    quit result
}

}
