/// This class includes methods which collect WebTerminal's analytics such as error and installation reports.
Class WebTerminal.Analytics Extends Common
{

/// Returns system global unique identifier.
ClassMethod GetSGUID ()
{
    return:($get(^WebTerminal("SGUID")) '= "") ^WebTerminal("SGUID")
    set ^WebTerminal("SGUID") = ##class(%SYSTEM.Util).CreateGUID()
    return ^WebTerminal("SGUID")
}

ClassMethod ReportInstallError ()
{

}

}