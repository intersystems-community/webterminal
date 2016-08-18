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
    optWhitespace
} from "./pushdownAutomaton";

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
    id({ value: "help", class: "special" }),
    id({ value: "about", class: "special" }),
    id({ value: "info", class: "special" })
).exit().end();

rule("cosCommand").split(
    id([
        { value: "d", class: "keyword" },
        { value: "do", class: "keyword" }
    ]).whitespace().branch().call("doArgument").optWhitespace().split(
        char(",").optWhitespace().merge(), // -> loop to the last branch
        any().exit()
    ),
    id([
        { value: "w", class: "keyword" },
        { value: "write", class: "keyword" },
        { value: "zw", class: "keyword" },
        { value: "zwrite", class: "keyword" }
    ]).whitespace().branch().split(
        char({ value: "!", class: "special" }),
        call("expression")
    ).optWhitespace().split(
        char(",").optWhitespace().merge(), // -> loop to the last branch
        any().exit()
    ),
    id([
        { value: "s", class: "keyword" },
        { value: "set", class: "keyword" }
    ]).whitespace().branch().call("variable").optWhitespace().char("=").optWhitespace()
        .call("expression").optWhitespace().split(
            char(",").optWhitespace().merge(), // -> loop to the last branch
            any().exit()
        ),
    id([
        { value: "k", class: "keyword" },
        { value: "kill", class: "keyword" }
    ]).whitespace().branch().call("variable").optWhitespace().split(
        char(",").optWhitespace().merge(), // -> loop to the last branch
        any().exit()
    )
).end();

rule("doArgument").split(
    char({ value: "^", class: "global" }).id({ type: "routine" }),
    call("class").split(
        char(":").call("expression"),
        any()
    )
).exit().end();

rule("expression").split(
    constant(),
    char("(").call("expression").char(")"),
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
        char("_")
    ).optWhitespace().call("expression"),
    any()
).exit().end();

rule("variable").split(
    split(
        id({ class: "variable", type: "variable" }),
        char({ value: "%", class: "variable", type: "variable" })
            .id({ class: "variable", type: "variable" })
    ).branch().split(
        char({ value: ".", type: "*" }).call("member").merge(),
        any()
    ),
    char({ value: "^", class: "global", type: "global" }).branch()
        .id({ class: "global", type: "global" }).split(
            char({ value: ".", class: "global", type: "global" }).merge(),
            any()
    ).split(
        char("(").call("argumentList").char(")"),
        any()
    )
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
        id({ value: "class", class: "special" }).char({ value: "(", class: "special" }).split(
            char({ value: "%", type: "classname", class: "classname" }),
            any()
        ).branch().id({ type: "classname", class: "classname" }).split(
            char({ value: ".", type: "classname", class: "classname" }).merge(),
            char({ value: ")", class: "special", type: "*" }).char({ value: ".", type: "*" })
                .split(
                    char({ value: "#", type: "parameter", class: "keyword" })
                        .id({ type: "parameter", class: "keyword" }),
                    split(
                        char({ value: "%", type: "publicClassMember", class: "keyword" }),
                        any()
                    ).id({ type: "publicClassMember", class: "keyword" }).split(
                        char("(").call("argumentList").char(")")
                    )
            )
        ),
        id({ value: "super", class: "special" })
            .char({ value: "(", class: "special" })
            .call("argumentList")
            .char({ value: ")", class: "special" })
    )
).exit().end();

rule("function").char({ value: "$", class: "keyword" }).split(
    char({ value: "$", class: "keyword" }),
    any()
).id({ class: "keyword" }).split(
    char("(").call("argumentList").char(")"),
    any()
).exit().end();

rule("argumentList").split(
    tryCall("expression").branch().split(
        char(",").optWhitespace().call("expression").merge(),
        any()
    ),
    any()
).exit().end();
