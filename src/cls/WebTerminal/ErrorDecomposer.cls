Class WebTerminal.ErrorDecomposer
{

Parameter LINES As %Numeric = 5;

/// Takes $ZERROR function result.
/// Returns either simple string or %ZEN.proxyObject representing the error details.
ClassMethod DecomposeError (err As %String = "", ns As %String = "")
{
    new $namespace
    if (ns '= "") {
        try {
            set $namespace = ns
        } catch (e) {
            return err
        }
    }
    return:($FIND(err, "<") '= 2) err
    set startPos = $FIND(err, ">")
    return:(startPos = 0) err
    set spacePos = $FIND(err, " ") - 1
    return:(spacePos = startPos) err
    set label = $EXTRACT(err, startPos, $case(spacePos = -1, 1:999, :spacePos-1))
    return:(label = "") err
    try {
        set obj = ##class(%ZEN.proxyObject).%New()
        set obj.zerror = err
        set plusPos = $FIND(label, "+")
        set cPos = $FIND(label, "^")
        if (plusPos = 0) || (cPos = 0) {
            set obj.source = $TEXT(@label)
            set obj.line = 0
            return obj
        }
        set line = +$EXTRACT(label, plusPos, cPos - 2)
        set part1 = $EXTRACT(label, 1, plusPos - 1)
        set part2 = $EXTRACT(label, cPos - 1, *)
        set range = ..#LINES \ 2
        set obj.source = ""
        set obj.line = 0
        for i=line-range:1:line+range {
            continue:(i < 1)
            set label = part1 _ i _ part2
            set text = $TEXT(@label)
            set:(text '= "") obj.source = obj.source _ $case(obj.source = "", 1: "", :$C(10)) _ text
            set:((text '= "") && (i < line)) obj.line = obj.line + 1
        }
        return obj
    } catch (e) {
        return err
    }
    return err
}

}