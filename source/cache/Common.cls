Include %sySystem

Class WebTerminal.Common
{

/// How long to wait for authorization key when connection established
Parameter AuthorizationTimeout = 5;

Parameter ServerActionExecute As %Char = "EXEC";

Parameter ServerActionExecuteSQL As %Char = "SQL";

Parameter ServerActionGenerateAutocomplete As %Char = "AC";

Parameter ServerActionTrace As %Char = "TRACE";

Parameter ServerActionStopTraceAll As %Char = "STOP_TRACE_ALL";

Parameter ServerActionCheckTrace As %Char = "CT";

Parameter ServerActionReset As %Char = "R";

Parameter ServerActionEcho As %Char = "E";

Parameter ServerActionCheckUpdate As %Char = "CU";

Parameter ServerActionUpdate As %Char = "U";

Parameter ServerActionRename As %Char = "RENAME";

Parameter ClientPrompt As %String = "PROMPT#";

Parameter ClientStartExec As %String = "EST#";

Parameter ClientEndExec As %String = "END#";

Parameter ClientOutputMessage As %String = "O#";

Parameter ClientOutputLocalized As %String = "OL#";

Parameter ClientChangeNamespace As %String = "NS#";

Parameter ClientLoadAutocomplete As %String = "AC#";

Parameter ClientReadString As %String = "R#";

Parameter ClientReadChar As %String = "RC#";

Parameter ClientAuthorizationStatus As %String = "AUTH#";

Parameter ClientTrace As %String = "TRACE#";

Parameter ClientStopTrace As %String = "STOP_TRACE#";

Parameter ClientLoginInfo As %String = "I#";

Parameter ClientClearScreen As %String = "CLRSCR#";

Parameter ClientPromptUpdate As %String = "PROMPT_UPDATE#";

Method SendData(query As %String = "", action As %String = "") As %Status
{
    write query,$c(9),action
    quit $$$OK
}

}
