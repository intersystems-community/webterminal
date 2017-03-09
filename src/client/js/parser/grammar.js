//  THIS MODULE IS INVOKED AT THE BUILD TIME. ANY ERRORS ARE REPORTED DURING THE GULP BUILD TASK  \\
//                                                                                                \\
// ---------------------------------- CONTRIBUTION GUIDELINE ------------------------------------ \\
//                                                                                                \\
//     This module describes the Caché ObjectScript language with JavaScript semantics. Follow    \\
// the simple rules listed below to add/remove/fix any autocomplete and highlight-related issues. \\
//                                                                                                \\
//     Introduction                                                                               \\
//     To get an intelligent autocomplete/syntax highlight which WebTerminal has, there is a need \\
// to teach machine how to parse code. We will tell it the general rules of how the character     \\
// sequences (COS code) must be placed, and it will look ahead to predict which ones it can       \\
// suggest.                                                                                       \\
//     Everything here is defined by rules. The parsing begins with the main rule named COS. This \\
// rule is an infinite loop which loops again and again with the "command" rule. Let's begin with \\
// some simple examples of creating programming languages rules here.                             \\
//
// Chain element                  Description
// rule("ruleName")               Starts describing a new rule named "ruleName".
// char("=")                      Matches "=" character. Note that numeric or alphabetical
//                                characters cannot be matched with char().
// id("write")                    Matches keyword "write".
// constant()                     Matches any positive numeric constant.
// whitespace()                   Matches one or more whitespace characters.
// optWhitespace()                Matches any number of whitespace characters, or no characters.
// branch()                       Creates a label in the chain.
// merge()                        Returns to a label in the chain. This is the last chain element.
// split(...)                     Allows to split the chain and math one of <...>.
// any()                          Matches if nothing else is matched. Used as the last split()
//                                argument. Does not take the match.
// all()                          Matches anything and takes the match.
// none()                         Does not match anything (gives error) and takes the match.
// call("ruleName")               Call another rule and continue chain when rule exits.
// exit()                         Exit the chain
// end()                          Must be an end point of any chain.
//                                                                                                \\
//     Defining New Rules Basics                                                                  \\
//     Let's say we need to describe a rule for "write 12" (write any number) statement.          \\
//
//     EXAMPLE 1: match "write 12"
// | rule("test").id("write").whitespace().constant().exit().end()
//       |             |           |           |        |     |
//       > rule("test") starts a new chain, and creates a new rule named "test".
//                     |           |           |        |     |
//                     > id("write") matches a "write" identifier. All words are identifiers.
//                                 |           |        |     |
//                                 > whitespace() matches one or more spaces.
//                                             |        |     |
//                                             > constant() matches any positive numeric constant.
//                                                      |     |
//                             exit() or merge() must be the end point in any chain
//                                                            |
//                                                end() must close the rule()
//
//     EXAMPLE 2: match "1+(3+4)"
//     Let's start by matching a number.
// | rule("expr").constant().exit().end()
//     In this case, our rule will match only this: "1", "100500", "10.123", ".10", etc. Next, let's
// match any sequence of numbers, divided by "+" sign. To do this, we need a loop. The chain can be
// looped using branch() and merge() modifier. branch() labels a place to which we can return with
// merge() modifier.
// | rule("expr").branch().constant().char("+").merge().end()
//     Now, "1+2+6+5.63+.44"... is matching, infinitely. But apparently we need to match any
// mathematical expression, with "(" and ")" symbols.
//     This task can't be described by one chain. We need some sort of "recursive" chain depending
// on what symbols we have. See the right example:
// | rule("expr").split(
// |     constant()
// |     char("(").call("expr").char(")")
// | ).split(
// |     char("+").call("expr"),
// |     any()
// | ).exit().end()
//
//     Typical Grammar Mistakes
// | <...>.split(
// |     optWhitespace().char("+"),
// |     char("!")
// | ).<...>
//     Explanation: symbol "!" will never be matched, as optWhitespace() matches in any case.

//     BASIC HOW-TO
// For example, let's take an "id()" chain element. Actually, you can specify the same not only for
// id() element, but for char(), whitespace(), string() and constant() as well.
// Chain element example                         Explanation
// id()                                          Matches any identifier (/[a-zA-Z][a-zA-Z0-9]/).
// char()                                        Matches any character (character is everything
//                                               which is not a: string, constant, identifier,
//                                               whitespace).
// char("#")                                     Matches an exact character "#".
// char({ value: "#" })                          The same as in example above, matches the exact
//                                               character "#", this is just another form of spec.
// id({ value: "super" })                        Matches identifier of exact value "class".
// id({ value: "super", class: "keyword" })      Matches identifier of exact value "class" and
//                                               highlights the output with the CSS style "keyword".
// id({ type: "variable" })                      Basically, again, matches any identifier. But now
//                                               it assigns the type to this ID. This means a lot
//                                               for autocomplete: check autocomplete/types.js
//                                               module. By having a type, WebTerminal can suggest
//                                               variants to complete this identifier with. The
//                                               suggesting logic is written in types.js module.
//                                               In this example, suggesting mechanism will take
//                                               this identifier as local variable and try to
//                                               suggest the ending of it.
// id({ type: "a", class: "b", value: "c" })     Combine any properties in the way you need!
// id({ type: "a" }).char(";").id({ type: "b" }) Now let's go deeper. In types.js module, there is
//                                               an argument passed named "collector". This argument
//                                               contains matched chain elements, which have "type",
//                                               and if there are anything between those elements,
//                                               type "," is inserted. Collector is always an array.
//                                               So for this example collector is the next:
//                                               ["a", ",", "b"]. NOTE: the actual collector's value
//                                               is [
//                                                   { value: "?", type: "a" },
//                                                   { value: "", type: "," },
//                                                   { value: "?", type: "b" }
//                                                  ], but for the shorten form here only the type
//                                               will be specified as an array value. Please keep in
//                                               mind that collector's array element is an object,
//                                               which type is specified and the value is equal to
//                                               the matched value.
// id({ type: "a" }).char(":").id().char(";")    Collector is ["a", ","]
// char("#").char("#").id({ value: "class" })    Collector is [","] (as no types specified at all)
// id({ type: "a" }).char(";").id({ type: "b" }) Collector allows to build a login that finds a
//                                               complex syntax constructions and the chain gives
//                                               you control on how to collect things to collector.
//                                               Here collector will be ["a", ",", "b"], which
//                                               allows us to say that identifiers with types "a"
//                                               and "b" is separated by something.
// split(char({ value: "%", type: "a" }), any()) Here is a tiny example of how you can suggest a COS
// .id({ type: "a" })                            variable name. Now collector is of type ["a", "a"],
//                                               note that it doesn't has a separating ",", as
//                                               matching elements go in a line. For example, in
//                                               string "%Nikita" collector values will be
//                                               ["%", "Nikita"], and you can join last N elements
//                                               of the same type to get a base "%Nikita" for
//                                               suggesting.
// id({ type: "var" }).char(".")                 In this example you would probably need to access
// .id({ type: "classMember" })                  "variable" without having a delimiter "," in the
//                                               collector, which is ["var", ",", "classMember"].
// id({ type: "var" })                           To make collector's value ["var", "classMember"],
// .char({ value: ".", type: "*" })              or to avoid adding a "," to collector, assign type
// .id({ type: "classMember" })                  "*" to chain elements which should not appear in
//                                               collector. todo: check if we need "*" actually.
//                                               todo: collectOfType can handle the task without "*"

import {
    rule, id, char, string, split, any, all, none, branch, merge, exit, constant, call, tryCall,
    optWhitespace, whitespace
} from "./pushdownAutomaton";
const CI = true; // case insensitive

// Rules definition start

rule("CWTInput").split(
    char({ value: "/", class: "special" }).call("CWTSpecial").exit(),
    any().branch().call("cosCommand").whitespace().merge()
).end();
// EXPLANATION:
// rule("CWTInput")    Defines a new rule named "CWTInput".
// .split(a, b, ...)   Allows multiple choices.
// char()              Matches a character. Assigns a class to this character.
// .call("CWTSpecial") Calls "CWTSpecial" rule and continues chain when "CWTSpecial" exits.
// .exit()             Exits the rule.
// .branch()           Defines a new label in the current branch.
// .call("command")    Jumps to the "command" rule. Continues the chain after "command" rule exits.
// .whitespace()       Matches one or more space characters.
// .merge()            Returns to the last defined label.
// .end()              Builds the rule.
// As a result, rule "root" is an infinite loop, as merge() at the end always starts the chain over.

rule("CWTSpecial").split(
    // Please, keep following items ordered alphabetically.
    id({ value: "help", class: "special" }),
    id({ value: "clear", class: "special" }),
    id({ value: "config", class: "special" }).whitespace().split(
        id({ value: "default", class: "global" }),
        split(
            id({ value: "defaultNamespace", class: "variable" }),
            id({ value: "initMessage", class: "variable" }),
            id({ value: "language", class: "variable" }),
            id({ value: "maxHistorySize", class: "variable" }),
            id({ value: "sqlMaxResults", class: "variable" }),
            id({ value: "suggestions", class: "variable" }),
            id({ value: "syntaxHighlight", class: "variable" }),
            id({ value: "serverName", class: "variable" }),
            id({ value: "updateCheck", class: "variable" }),
            id({ class: "variable" })
        ).optWhitespace()
            .char("=").optWhitespace().split(
            id({ class: "constant" }),
            string({ class: "string" }),
            constant({ class: "constant" })
        )
    ),
    id({ value: "favorite", class: "special" }).whitespace().split(
        id({ value: "delete", class: "wrong" }).whitespace().split(
            id({ class: "constant", type: "favorites" }),
            constant({ type: "favorites" })
        ),
        split(
            id({ class: "constant", type: "favorites" }),
            constant({ type: "favorites" })
        ).whitespace().split(
            any().call("cosCommand")
        )
    ),
    id({ value: "info", class: "special" }),
    id({ value: "logout", class: "special" }),
    id({ value: "sql", class: "special" }),
    id({ value: "trace", class: "special" }).whitespace().split(
        id({ value: "stop", class: "global" }),
        tryCall("global"),
        split(
            char({ type: "filename", class: "string" }),
            id({ type: "filename", class: "string" })
        ).branch().split(
            char({ type: "filename", class: "string" }),
            id({ type: "filename", class: "string" }),
            whitespace()
        ).merge()
    ),
    id({ value: "update", class: "special" })
).exit().end();

rule("cosCommand").split(
    id([
        { CI, value: "break", class: "keyword" },
        { CI, value: "b", class: "keyword" }
    ]).call("postCondition").optWhitespace().split(
        string(),
        constant(),
        any()
    ).exit(),
    id([
        { CI, value: "close", class: "keyword" },
        { CI, value: "c", class: "keyword" }
    ]).call("postCondition").whitespace().branch().split(
        string(),
        constant()
    ).split(
        char(",").optWhitespace().merge(),
        any()
    ).exit(),
    id({ CI, value: "continue", class: "keyword" }).call("postCondition").exit(),
    id([
        { CI, value: "do", class: "keyword" },
        { CI, value: "d", class: "keyword" }
    ]).call("postCondition").whitespace().branch().call("doArgument").optWhitespace().split(
        char(",").optWhitespace().merge(), // -> loop to the last branch
        any().exit()
    ),
    id([
        { CI, value: "write", class: "keyword" },
        { CI, value: "w", class: "keyword" }
    ]).call("postCondition").whitespace().branch().split(
        char({ value: "!", class: "special" }),
        tryCall("expression"),
        tryCall("termSpecial"),
        any()
    ).optWhitespace().split(
        char(",").optWhitespace().merge(),
        any().exit()
    ),
    id([
        { CI, value: "hang", class: "keyword" },
        { CI, value: "h", class: "keyword" }
    ]).call("postCondition").whitespace().call("expression").exit(),
    id({ CI, value: "halt", class: "keyword" }).call("postCondition").exit(),
    id([
        { CI, value: "job", class: "keyword" },
        { CI, value: "j", class: "keyword" }
    ]).call("postCondition").whitespace().branch().call("doArgument").optWhitespace().split( // temp
        char(",").optWhitespace().merge(),
        any().exit()
    ).exit(),
    id([
        { CI, value: "merge", class: "keyword" },
        { CI, value: "m", class: "keyword" }
    ]).call("postCondition").whitespace().split(
        tryCall("variable"),
        call("global")
    ).optWhitespace().char("=").optWhitespace().split(
        tryCall("variable"),
        call("global")
    ).exit(),
    id([
        { CI, value: "open", class: "keyword" },
        { CI, value: "o", class: "keyword" }
    ]).call("postCondition").whitespace().branch().split(
        string(),
        constant()
    ).split(
        char(":").split(
            char("(").call("deviceParameters").char(")").split(
                char(":").split(
                    constant().split(
                        char(":").string(),
                        any()
                    ),
                    string()
                ),
                any()
            ),
            constant().split(
                char(":").string(),
                any()
            ),
            string()
        ),
        any()
    ).split(
        char(",").optWhitespace().merge(),
        any()
    ).exit(),
    id([
        { CI, value: "zwrite", class: "keyword" },
        { CI, value: "zw", class: "keyword" }
    ]).call("postCondition").whitespace().branch().split(
        tryCall("expression"),
        any()
    ).optWhitespace().split(
        char(",").optWhitespace().merge(),
        any().exit()
    ).exit(),
    id([
        { CI, value: "set", class: "keyword" },
        { CI, value: "s", class: "keyword" }
    ]).call("postCondition").whitespace().branch().call("setExpression").optWhitespace().split(
        char(",").optWhitespace().merge(),
        any().exit()
    ),
    id({ CI, value: "try", class: "keyword" }).optWhitespace().char("{").branch().optWhitespace()
        .split(
            char("}").optWhitespace().id({ CI, value: "catch", class: "keyword" })
                .optWhitespace().split(
                    char("(").id({ class: "variable" }).char(")"),
                    id({ class: "variable" })
                ).optWhitespace().char("{").branch().optWhitespace().split(
                    char("}"),
                    call("cosCommand").whitespace().merge()
                ),
            call("cosCommand").whitespace().merge()
    ).exit(),
    id([
        { CI, value: "kill", class: "keyword" },
        { CI, value: "k", class: "keyword" }
    ]).call("postCondition").whitespace().branch().split(
        char("(").call("variableListExpression").char(")"),
        call("variable")
    ).optWhitespace().split(
        char(",").optWhitespace().merge(), // -> loop to the last branch
        any().exit()
    ),
    id([
        { CI, value: "quit", class: "keyword" },
        { CI, value: "q", class: "keyword" },
        { CI, value: "return", class: "keyword" }
    ]).call("postCondition").optWhitespace().split(
        tryCall("expression"),
        any()
    ).exit(),
    id([
        { CI, value: "read", class: "keyword" },
        { CI, value: "r", class: "keyword" }
    ]).call("postCondition").whitespace().branch().split(
        string(),
        split(
            id({ class: "variable", type: "variable" }).split(
                char({ value: "#", class: "special" }).call("expression"),
                any()
            ),
            char({ value: "*", class: "special" }).id({ class: "variable", type: "variable" })
        ).split(
            char({ value: ":", class: "special" }).call("expression"),
            any()
        ),
        call("termSpecial")
    ).optWhitespace().split(
        char(",").optWhitespace().merge(), // -> loop to the last branch
        any().exit()
    ),
    id([
        { CI, value: "tstart", class: "keyword" },
        { CI, value: "ts", class: "keyword" },
        { CI, value: "tcommit", class: "keyword" },
        { CI, value: "tc", class: "keyword" }
    ]).call("postCondition").exit(),
    id([
        { CI, value: "trollback", class: "keyword" },
        { CI, value: "tro", class: "keyword" }
    ]).call("postCondition").exit(),
    id([
        { CI, value: "use", class: "keyword" },
        { CI, value: "u", class: "keyword" }
    ]).call("postCondition").whitespace().branch().split(
        string(),
        constant(),
        char({ value: "$", class: "keyword" }).id([
            { CI, value: "io", class: "keyword" },
            { CI, value: "principal", class: "keyword" }
        ])
    ).split(
        char(":").split(
            char("(").call("deviceParameters").char(")").split(
                char(":").string(),
                any()
            ),
            string()
        ),
        any()
    ).split(
        char(",").optWhitespace().merge(),
        any()
    ).exit(),
    id([
        { CI, value: "xecute", class: "keyword" },
        { CI, value: "x", class: "keyword" }
    ]).call("postCondition").whitespace().branch().string().call("postCondition").optWhitespace()
        .split(
            char(",").optWhitespace().merge(),
            any().exit()
        ),
    id([
        { CI, value: "zload", class: "keyword" },
        { CI, value: "zl", class: "keyword" }
    ]).call("postCondition").whitespace().branch().id({ type: "routine", class: "global" }).exit(),
    id([
        { CI, value: "znspace", class: "keyword" },
        { CI, value: "zn", class: "keyword" }
    ]).call("postCondition").whitespace().string().exit(),
    id([
        { CI, value: "if", class: "keyword" },
        { CI, value: "i", class: "keyword" }
    ]).whitespace().call("expression").optWhitespace().split(
        char("{").optWhitespace().branch().call("cosCommand").optWhitespace().split(
            char("}").optWhitespace().split(
                id({ CI, value: "else", class: "keyword" }).optWhitespace()
                    .char("{").optWhitespace().branch().call("cosCommand").optWhitespace().split(
                        char("}").exit(),
                        any().merge()
                    ),
                id({ CI, value: "elseif", class: "keyword" }).whitespace().call("expression")
                    .optWhitespace().char("{").optWhitespace().merge()
            ),
            any().merge()
        ),
        call("cosCommand")
    ).exit(),
    id([
        { CI, value: "for", class: "keyword" },
        { CI, value: "f", class: "keyword" }
    ]).whitespace().branch()
        .id({ type: "variable", class: "variable" }).char("=").call("expression").optWhitespace()
            .split(
                char(":").optWhitespace().call("expression").optWhitespace().split(
                    char(":").optWhitespace().call("expression"),
                    any()
            ),
        any()
    ).optWhitespace().split(
        char(",").optWhitespace().merge(),
        any()
    ).char("{").optWhitespace().branch().call("cosCommand").optWhitespace().split(
        char("}").exit(),
        any().merge()
    ),
    id({ CI, value: "while", class: "keyword" }).whitespace().branch().call("expression")
        .optWhitespace().split(
            char(",").optWhitespace().merge(),
            char("{").optWhitespace().branch().call("cosCommand").optWhitespace().split(
                char("}").exit(),
                any().merge()
            )
        )
).end();

rule("setExpression").split(
    char("(").call("variableListExpression").char(")"),
    call("variable")
).optWhitespace().char("=").optWhitespace()
    .call("expression").exit().end();

rule("variableListExpression").branch().optWhitespace().call("variable").optWhitespace().split(
    char(",").merge(),
    any()
).exit().end();

rule("deviceParameters").branch().split(
    char({ value: "/", class: "special" }).id({ class: "special" }).split(
        char("=").call("expression"),
        any()
    ).split(
        char(":").merge(),
        any()
    ),
    string().split(
        char(":").merge(),
        any()
    ),
    any()
).exit().end();

rule("termSpecial").split(
    split(
        char({ value: "!", class: "special" }),
        char({ value: "#", class: "special" })
    ).branch().split(
        split(
            char({ value: "!", class: "special" }),
            char({ value: "#", class: "special" })
        ).merge(),
        char({ value: "?", class: "special" }).call("expression"),
        any()
    ),
    char({ value: "?", class: "special" }).call("expression")
).exit().end();

rule("postCondition").split(
    char(":").call("expression"),
    any()
).exit().end();

rule("doArgument").split(
    char({ value: "^", class: "global" }).branch().split(
        char({ value: "%", type: "routine", class: "global" }),
        any()
    ).id({ type: "routine", class: "global" }).split(
        char({ value: ".", type: "routine", class: "global" }).merge(),
        any()
    ),
    id({ class: "variable", type: "variable" }).char({ value: ".", type: "*" }).branch().split(
        char({ value: "%", type: "memberMethod" }),
        any()
    ).id({ type: "memberMethod" }).split(
        char("(").call("argumentList").char(")").split(
            char({ value: ".", type: "*" }).merge(),
            any()
        ),
        char({ value: ".", type: "*" }).merge()
    ),
    call("class")
).call("postCondition").exit().end();

rule("expression").split(
    constant(),
    char("(").call("expression").char(")"),
    char("'").call("expression"),
    string(),
    tryCall("variable"),
    tryCall("class"),
    tryCall("function")
).optWhitespace().split(
    split(
        char("+"),
        char("-"),
        char("*"),
        char("/"),
        char("_"),
        char("="),
        char("'").char(["=", ">", "<"]),
        char(["<", ">"]).split(
            char("="),
            any()
        ),
        char("&").split(
            char("&"),
            any()
        ),
        char("|").char("|")
    ).optWhitespace().call("expression"),
    any()
).exit().end();

rule("variable").split(
    split(
        char("@"),
        any()
    ).split(
        id({ class: "variable", type: "variable" }),
        char({ value: "%", class: "variable", type: "variable" })
            .id({ class: "variable", type: "variable" })
    ).split(
        char("(").call("nonEmptyArgumentList").char(")"),
        any()
    ).branch().split(
        char({ value: ".", type: "*" }).call("member").merge(),
        any()
    ),
    call("global")
).exit().end();

rule("global").char({ value: "^", class: "global", type: "global" }).branch()
    .id({ class: "global", type: "global" }).split(
        char({ value: ".", class: "global", type: "global" }).merge(),
        any()
).split(
    char("(").call("argumentList").char(")"),
    any()
).exit().end();

rule("member").split(
    char({ value: "%", type: "member" }),
    char({ value: "#", type: "member" }),
    any()
).id({ type: "member" }).split(
    char("(").call("argumentList").char(")"),
    any()
).exit().end();

rule("class").split(
    char({ value: "#", class: "special" }).char({ value: "#", class: "special" }).split(
        id({ CI, value: "class", class: "special" }).char({ value: "(", class: "special" }).split(
            char({ value: "%", type: "classname", class: "classname" }),
            any()
        ).branch().id({ type: "classname", class: "classname" }).split(
            char({ value: ".", type: "classname", class: "classname" }).merge(),
            char({ value: ")", class: "special", type: "*" }).char({ value: ".", type: "*" })
                .call("classStatic")
        ),
        id({ CI, value: "super", class: "special" })
            .char({ value: "(", class: "special" })
            .call("argumentList")
            .char({ value: ")", class: "special" })
    ),
    char({ value: "$", class: "special" }).id({ CI, value: "system", class: "special" })
        .char({ value: ".", type: "classname", class: "classname" })
        .id({ type: "classname", class: "classname" })
        .char({ value: ".", type: "*" }).call("classStatic")
).exit().end();

rule("classStatic").split(
    char({ value: "#", type: "parameter", class: "keyword" })
        .id({ type: "parameter", class: "keyword" }),
    split(
        char({ value: "%", type: "publicClassMember", class: "keyword" }),
        any()
    ).id({ type: "publicClassMember", class: "keyword" }).split(
        char("(").call("argumentList").char(")")
    )
).exit().end();

rule("function").char({ value: "$", class: "keyword" }).split(
    id([
        { CI, class: "keyword", value: "ascii" },
        { CI, class: "keyword", value: "bit" },
        { CI, class: "keyword", value: "bitcount" },
        { CI, class: "keyword", value: "bitfind" },
        { CI, class: "keyword", value: "bitlogic" },
        { CI, class: "keyword", value: "char" },
        { CI, class: "keyword", value: "classmethod" },
        { CI, class: "keyword", value: "classname" },
        { CI, class: "keyword", value: "compile" },
        { CI, class: "keyword", value: "data" },
        { CI, class: "keyword", value: "decimal" },
        { CI, class: "keyword", value: "double" },
        { CI, class: "keyword", value: "extract" },
        { CI, class: "keyword", value: "factor" },
        { CI, class: "keyword", value: "find" },
        { CI, class: "keyword", value: "fnumber" },
        { CI, class: "keyword", value: "get" },
        { CI, class: "keyword", value: "increment" },
        { CI, class: "keyword", value: "inumber" },
        { CI, class: "keyword", value: "isobject" },
        { CI, class: "keyword", value: "isvaliddouble" },
        { CI, class: "keyword", value: "isvalidnum" },
        { CI, class: "keyword", value: "justify" },
        { CI, class: "keyword", value: "length" },
        { CI, class: "keyword", value: "lb" },
        { CI, class: "keyword", value: "listbuild" },
        { CI, class: "keyword", value: "listdata" },
        { CI, class: "keyword", value: "listfind" },
        { CI, class: "keyword", value: "listfromstring" },
        { CI, class: "keyword", value: "listget" },
        { CI, class: "keyword", value: "listlength" },
        { CI, class: "keyword", value: "listnext" },
        { CI, class: "keyword", value: "listsame" },
        { CI, class: "keyword", value: "listtostring" },
        { CI, class: "keyword", value: "listupdate" },
        { CI, class: "keyword", value: "listvalid" },
        { CI, class: "keyword", value: "list" },
        { CI, class: "keyword", value: "locate" },
        { CI, class: "keyword", value: "match" },
        { CI, class: "keyword", value: "method" },
        { CI, class: "keyword", value: "name" },
        { CI, class: "keyword", value: "nconvert" },
        { CI, class: "keyword", value: "next" },
        { CI, class: "keyword", value: "normalize" },
        { CI, class: "keyword", value: "now" },
        { CI, class: "keyword", value: "number" },
        { CI, class: "keyword", value: "order" },
        { CI, class: "keyword", value: "parameter" },
        { CI, class: "keyword", value: "piece" },
        { CI, class: "keyword", value: "prefetchoff" },
        { CI, class: "keyword", value: "prefetchon" },
        { CI, class: "keyword", value: "property" },
        { CI, class: "keyword", value: "qlength" },
        { CI, class: "keyword", value: "qsubscript" },
        { CI, class: "keyword", value: "query" },
        { CI, class: "keyword", value: "random" },
        { CI, class: "keyword", value: "replace" },
        { CI, class: "keyword", value: "reverse" },
        { CI, class: "keyword", value: "sconvert" },
        { CI, class: "keyword", value: "sequence" },
        { CI, class: "keyword", value: "sortbegin" },
        { CI, class: "keyword", value: "sortend" },
        { CI, class: "keyword", value: "stack" },
        { CI, class: "keyword", value: "text" },
        { CI, class: "keyword", value: "translate" },
        { CI, class: "keyword", value: "view" },
        { CI, class: "keyword", value: "wascii" },
        { CI, class: "keyword", value: "wchar" },
        { CI, class: "keyword", value: "wextract" },
        { CI, class: "keyword", value: "wfind" },
        { CI, class: "keyword", value: "wiswide" },
        { CI, class: "keyword", value: "wlength" },
        { CI, class: "keyword", value: "wreverse" },
        { CI, class: "keyword", value: "xecute" },
        { CI, class: "keyword", value: "xecute" },
        { CI, class: "keyword", value: "zabs" },
        { CI, class: "keyword", value: "zarccos" },
        { CI, class: "keyword", value: "zarcsin" },
        { CI, class: "keyword", value: "zarctan" },
        { CI, class: "keyword", value: "zcos" },
        { CI, class: "keyword", value: "zcot" },
        { CI, class: "keyword", value: "zcsc" },
        { CI, class: "keyword", value: "zdate" },
        { CI, class: "keyword", value: "zdateh" },
        { CI, class: "keyword", value: "zdatetime" },
        { CI, class: "keyword", value: "zdatetimeh" },
        { CI, class: "keyword", value: "zexp" },
        { CI, class: "keyword", value: "zhex" },
        { CI, class: "keyword", value: "zln" },
        { CI, class: "keyword", value: "zlog" },
        { CI, class: "keyword", value: "zpower" },
        { CI, class: "keyword", value: "zsec" },
        { CI, class: "keyword", value: "zsin" },
        { CI, class: "keyword", value: "zsqr" },
        { CI, class: "keyword", value: "ztan" },
        { CI, class: "keyword", value: "ztime" },
        { CI, class: "keyword", value: "ztimeh" },
        { CI, class: "keyword" }
    ]),
    char({ value: "$", class: "keyword" }).id({ class: "keyword" }),
    any()
).split(
    char("(").call("argumentList").char(")"),
    any()
).exit().end();

rule("argumentList").split(
    tryCall("nonEmptyArgumentList"),
    any()
).exit().end();

rule("nonEmptyArgumentList").branch().split(
    char({ value: ".", class: "argument" }).id({ class: "argument" }),
    call("expression")
).split(
    char(",").optWhitespace().merge(),
    any()
).exit().end();

rule("SQLMode").split(
    char({ value: "/", class: "special" }).call("CWTSpecial").exit(),
    id({ CI, value: "delete", class: "keyword" }).whitespace()
        .call("SQLFrom").whitespace()
        .id({ CI, value: "where", class: "keyword" }).whitespace().call("SQLExpression")
        .whitespace(),
    id({ CI, value: "update", class: "keyword" }).whitespace()
        .call("SQLClassName").whitespace()
        .id({ CI, value: "set", class: "keyword" }).whitespace().branch()
            .id({ type: "sqlFieldName", class: "variable" }).optWhitespace().char("=").optWhitespace()
            .call("SQLExpression").optWhitespace().split(
                char(",").optWhitespace().merge(),
                any()
            )
        .id({ CI, value: "where", class: "keyword" }).whitespace().call("SQLExpression")
        .whitespace(),
    id({ CI, value: "select", class: "keyword" }).whitespace().split(
        id({ CI, value: "top", class: "keyword" }).whitespace().constant().whitespace(),
        any()
    ).split(
        char({ value: "*", class: "special" }),
        branch().id({ class: "variable", type: "sqlFieldName" }).optWhitespace().branch().split(
            char("-").char(">").optWhitespace()
                .id({ class: "variable", type: "sqlFieldName" }).optWhitespace().merge(),
            any()
        ).split(
            id({ CI, value: "as", class: "keyword" }).whitespace().id({ class: "variable" })
                .optWhitespace(),
            any()
        ).split(
            char(",").optWhitespace().merge(),
            any()
        )
    ).whitespace().call("SQLFrom").whitespace().split(
        id({ CI, value: "where", class: "keyword" }).whitespace().call("SQLExpression")
            .whitespace(),
        any()
    ).split(
        id({ CI, value: "order", class: "keyword" }).whitespace()
            .id({ CI, value: "by", class: "keyword" }).whitespace()
            .branch().id({ class: "variable", type: "sqlFieldName" }).optWhitespace().split(
                id({ CI, value: "desc", class: "keyword" }).optWhitespace(),
                id({ CI, value: "asc", class: "keyword" }).optWhitespace(),
                any()
            ).split(
                char(",").optWhitespace().merge(),
                any()
            ),
        any()
    )
).exit().end();

rule("SQLFrom").id({ CI, value: "from", class: "keyword" }).whitespace().call("SQLClassName")
    .exit().end();

rule("SQLClassName").split(
    char({ value: "%", type: "sqlClassname", class: "classname" }),
    any()
).branch().id({ type: "sqlClassname", class: "classname" }).split(
    char({ value: "_", type: "sqlClassname", class: "classname" }).merge(),
    char({ value: ".", type: "sqlClassname", class: "classname" })
        .id({ CI, type: "sqlClassname", class: "classname" }).split(
        char({ value: "_", type: "sqlClassname", class: "classname" })
            .id({ CI, type: "sqlClassname", class: "classname" }),
        any()
)).exit().end();

rule("SQLExpression").split(
    constant(),
    char("(").call("SQLExpression").char(")"),
    id({ CI, value: "not", class: "keyword" }).optWhitespace().call("SQLExpression"),
    char({ value: "'", class: "string" }).branch().split(
        char({ value: "'", class: "string" }),
        split(
            constant({ class: "string" }),
            id({ class: "string" }),
            string({ class: "string" }),
            char({ class: "string" }),
            whitespace()
        ).merge()
    ),
    id({ class: "variable", type: "sqlFieldName" }).split(
        char({ value: "_", class: "variable", type: "sqlFieldName" })
            .id({ class: "variable", type: "sqlFieldName" }),
        any()
    )
).optWhitespace().split(
    split(
        char("+"),
        char("-"),
        char("*"),
        char("/"),
        char("="),
        char(["<", ">"]).split(
            char("="),
            any()
        ),
        id({ CI, value: "and", class: "keyword" }),
        id({ CI, value: "like", class: "keyword" }),
        id({ CI, value: "or", class: "keyword" })
    ).optWhitespace().call("SQLExpression"),
    any()
).exit().end();