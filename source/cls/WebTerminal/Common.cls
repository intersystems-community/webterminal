Include %sySystem

Class WebTerminal.Common
{

/// Write out the contents of this proxy object to the current device in JSON format.<br/>
/// This method is called when a proxy object is used in conjunction with
/// the <class>%ZEN.Auxiliary.jsonProvider</class> component.<br/>
/// <var>pFormat</var> is a flags string to control output formatting options.<br/>
/// The following character option codes are supported:<br/>
/// 1-9 : indent with this number of spaces (4 is the default with the 'i' format specifier)<br/>
/// a - output null arrays/objects<br/>
/// b - line break before opening { of objects<br/>
/// c - output the Cach&eacute;-specific "_class" and "_id" properties (if a child property is an instance of a concrete object class)<br/>
/// e - output empty object properties<br/>
/// i - indent with 4 spaces unless 't' or 1-9<br/>
/// l - output empty lists<br/>
/// n - newline (lf)<br/>
/// o - output empty arrays/objects<br/>
/// q - output numeric values unquoted even when they come from a non-numeric property<br/>
/// s - use strict JSON output - <strong>NOTE:</strong> special care should be taken when sending data to a browser, as using this flag
/// may expose you to cross site scripting (XSS) vulnerabilities if the data is sent inside <code>&lt;script&gt;</code> tags. Zen uses
/// this technique extensively, so this flag should <strong>NOT</strong> be specified for jsonProviders in Zen pages.<br/>
/// t - indent with tab character<br/>
/// u - output pre-converted to UTF-8 instead of in native internal format<br/>
/// w - Windows-style cr/lf newline<br/>
ClassMethod GetJSONString(obj As %ZEN.proxyObject, pLevel As %Integer = 0, pFormat As %String = "") As %String
{
	#; JSON utility macros that use the JSON translation table instead of the JS translation table
	#define ZENJSNUM(%num)					$fnumber(%num,"LON")
	#define ZENJSISNUM(%val)				($IsValidNum(%val)&&(%val=+(%val)))
	#define ZENJSTABLE(%format)				("JS"_$S(%format["u":"ML",1:""))
	#define ZENJSONTABLE(%format)			("JSON"_$S((%format["u"):"ML",1:""))
	#define ZENJSONESCAPE(%str,%format)		$S(%format["s":$ZCVT(%str,"O",$$$ZENJSONTABLE(%format)),1:$Replace($ZCVT(%str,"O",$$$ZENJSTABLE(%format)),"\'","'"))
	#define ZENJSONSTR(%str,%format)		(""""_$$$ZENJSONESCAPE(%str,%format)_"""")
	#define ZENJSONPROP(%prop,%format)		$$$ZENJSONSTR(%prop,%format)
	#define ZENJSONVALUE(%val,%format)		$S($$$ZENJSISNUM(%val):$$$ZENJSNUM(%val),$C(0)=(%val)||$ListValid(%val):"""""",1:$$$ZENJSONSTR(%val,%format))
	#define ZENJSONPAIR(%pr,%val,%format)	$$$ZENJSONPROP(%pr,%format)_":"_$$$ZENJSONVALUE(%val,%format)
	set ser = ""
    Set tSC = $$$OK
	Try {
		Set tLF=$S(pFormat["w":$C(13,10), pFormat["n":$C(10), 1:"")
		If pFormat'=$TR(pFormat,"it123456789") { Set tN=+$ZStrip(pFormat,"<E'N"), $P(tTab,$S(pFormat["t":$C(9),1:" "),1+$S(tN:tN,pFormat["t":1,1:4))="" }
		Else { Set tTab="" }
		Set tIncludeWhitespace = (tLF_tTab'="")

		If pFormat["o" || 'pLevel {
			Set tPropCount = ""
			If (tIncludeWhitespace && pLevel) Set tIndent="", $P(tIndent,tTab,pLevel+1)="" set ser = ser _ $S(pFormat["b":tLF_tIndent,1:" ")
			set ser = ser _ "{"
		} Else {
			Set tPropCount = 0
		}
		Set tProp="" For { Set tProp=$O(obj.%data(tProp),1,tValue)  Quit:""=tProp
			If $IsObject(tValue) {
				If tValue.%IsA("%ZEN.proxyObject") {
					If pFormat["o" || tValue.hasJSONContent(pFormat) {
						Do nextProp
						set ser = ser _ $$$ZENJSONPROP(tProp,pFormat)_":"_..GetJSONString(tValue,pLevel+1,pFormat)
					}
				} ElseIf pFormat["o" || ##class(%ZEN.Auxiliary.jsonProvider).hasObjContent(tValue,.tVisited,pFormat) {
					Do nextProp
					set ser = ser _ $$$ZENJSONPROP(tProp,pFormat)_":"""""
				}
			} ElseIf pFormat["e" || $L(tValue) {
				Do nextProp
				set ser = ser _ $$$ZENJSONPAIR(tProp,tValue,pFormat)
			}
		}
		If tPropCount'=0 {
			#; either we wrote at least one property or we wrote an empty '{' due to "o" mode or level zero
			If tIncludeWhitespace Set tIndent="", $P(tIndent,tTab,pLevel+1)="" set ser = ser _ tLF_tIndent
			set ser = ser _ "}"
		}
	}
	Catch(ex) {
		Set tSC = ex.AsStatus()
		set ser = ser _ "/* Error in JSON output:"_$System.Status.DisplayError(tSC)_"*/"
	}
	Quit ser

nextProp
	If tPropCount=0 {
		If (tIncludeWhitespace && pLevel) Set tIndent="", $P(tIndent,tTab,pLevel+1)="" set ser = ser _ $S(pFormat["b":tLF_tIndent,1:" ")
		set ser = ser _ "{"
	} ElseIf tPropCount {
		set ser = ser _ ","
	} ; else tPropCount="" means we already did the starting '{' due to "o" mode
	Set tPropCount = tPropCount + 1
	If tIncludeWhitespace Set tIndent="", $P(tIndent,tTab,pLevel+2)="" set ser = ser _ tLF_tIndent
	Quit
}

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
