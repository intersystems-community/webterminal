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
    do rset.Execute($Namespace, pattern, 0)
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
    set pattern = $REPLACE(beginning, "%", "!%")
    &sql(select LIST(ID) into :ids from %Dictionary.ClassDefinition where ID like :pattern_'%' ESCAPE '!' and deployed <> 2)
    return ids
}

}
