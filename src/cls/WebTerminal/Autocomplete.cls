Class WebTerminal.Autocomplete Extends Common
{

/// Returns a comma-delimited string of globals names in the namespace, which begin from "beginning".
ClassMethod GetGlobals(namespace As %String = "%SYS", beginning As %String = "") As %String
{
    set result = ""
    set pattern = beginning _ "*"
    new $Namespace
    set $Namespace = namespace
    set rset = ##class(%ResultSet).%New("%SYS.GlobalQuery:NameSpaceList")
    do rset.Execute($Namespace, pattern, 1)
    while (rset.Next()) {
        set result = result _ $case(result = "", 1:"", :",") _ rset.GetData(1)
    }
    return result
}

/// Returns a comma-delimited string of class names in the namespace, which begin from "beginning".
ClassMethod GetClass(namespace As %String = "%SYS", beginning As %String = "") As %String
{
    new $Namespace
    set $Namespace = namespace
    set pattern = $REPLACE(beginning, "%", "!%") _ "%"
    &sql(select LIST(ID) into :ids from %Dictionary.CompiledClass where ID like :pattern ESCAPE '!' and deployed <> 2)
    return ids
}

/// Returns a comma-delimited string of public class members (accessible through ##class() construction) in the class of namespace.
ClassMethod GetPublicClassMembers(namespace As %String = "%SYS", className As %String = "", beginning As %String = "") As %String
{
    new $Namespace
    set $Namespace = namespace
    set pattern = $REPLACE(beginning, "%", "!%") _ "%"
    &sql(select LIST(Name) into :names from %Dictionary.CompiledMethod WHERE parent=:className AND ClassMethod=1 AND Name like :pattern ESCAPE '!')
    return names
}

/// Returns a comma-delimited string of class members in the class of namespace.
ClassMethod GetClassMembers(namespace As %String = "%SYS", className As %String = "", beginning As %String = "", methodsOnly = "") As %String
{
    new $Namespace
    set $Namespace = namespace
    if $EXTRACT(beginning, 1) = "#" {
        set ps = ..GetParameters(namespace, className, $EXTRACT(beginning, 2, $LENGTH(beginning)))
        return:(ps = "") ps
        return "#"_$REPLACE(ps, ",", ",#")
    }
    set pattern = $REPLACE(beginning, "%", "!%") _ "%"
    set props = ""
    &sql(select LIST(Name) into :methods from %Dictionary.CompiledMethod WHERE parent=:className AND Private = 0 AND Name like :pattern ESCAPE '!')
    if (methodsOnly = "") {
        &sql(select LIST(Name) into :props from %Dictionary.CompiledProperty WHERE parent=:className AND Name like :pattern ESCAPE '!')
    }
    return $case((methods '= "") && (props '= ""), 1: methods _ "," _ props, : methods _ props)
}

/// Returns a comma-delimited string of class members in the class of namespace.
ClassMethod GetParameters(namespace As %String = "%SYS", className As %String = "", beginning As %String = "") As %String
{
    new $Namespace
    set $Namespace = namespace
    set pattern = $REPLACE(beginning, "%", "!%") _ "%"
    &sql(select LIST(Name) into :names from %Dictionary.CompiledParameter WHERE parent=:className AND Name like :pattern ESCAPE '!')
    return names
}

/// Returns a comma-delimited string of routine names in the namespace, which begin from "beginning".
ClassMethod GetRoutines(namespace As %String = "%SYS", beginning As %String = "") As %String
{
    set result = ""
    set pattern = beginning _ "*.*"
    new $Namespace
    set $Namespace = namespace
    set rset = ##class(%ResultSet).%New("%Library.Routine:RoutineList")
    do rset.Execute(pattern, , , $Namespace)
    while (rset.Next()) {
        set result = result _ $case(result = "", 1:"", :",") _ $PIECE(rset.GetData(1), ".", 1, *-1)
    }
    return result
}

}
