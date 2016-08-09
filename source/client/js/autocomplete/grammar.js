//  THIS MODULE IS INVOKED AT THE BUILD TIME. ANY ERRORS ARE REPORTED DURING THE GULP BUILD TASK  \\

import {
    rule, id, char, string, split, any, all, branch, merge, exit, constant, call, tryCall,
    getAutomatonTable
} from "./pushdownAutomaton";

// ---------------------------------- CONTRIBUTION GUIDELINE ------------------------------------ \\
//     This module describes the Caché ObjectScript language with JavaScript semantics. Follow    \\
// the simple rules listed below to add/remove/fix any autocomplete and highlight-related issues. \\
//                                                                                                \\
//     Introduction                                                                                   \\
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
//

rule("COS").branch().call("command").whitespace().merge().end();
// EXPLANATION:
// rule("root")      Defines a new rule named "root".
// .branch()         Defines a new label in the current branch.
// .call("command")  Jumps to the "command" rule. Continues the chain after "command" rule exits.
// .whitespace()     Matches one or more space characters.
// .merge()          Returns to the last defined label.
// .end()            Builds the rule.
// As a result, rule "root" is an infinite loop, as merge() at the end always starts the chain over.

rule("command").split(
    id(["d", "do"]).whitespace().branch().call("doArgument").optWhitespace().split(
        char(",").optWhitespace().merge(), // -> loop to the last branch
        any().exit()
    ),
    id(["w", "write"]).whitespace().branch().call("expression").optWhitespace().split(
        char(",").optWhitespace().merge(), // -> loop to the last branch
        any().exit()
    )
).end();

rule("doArgument").split(
    char("^").id({ type: "routine" }),
    call("class").split(
        char(":").call("expression"),
        any()
    )
).exit().end();

rule("expression").split(
    constant(),
    char("(").call("expression").char(")"),
    string(),
    tryCall("class")
).split(
    split(
        char("+"),
        char("-"),
        char("*"),
        char("/"),
        char("_")
    ).call("expression"),
    any()
).exit().end();

rule("class").split(
    char("#").char("#").split(
        id("class").char("(").id({ type: "classname" }).char(")").char(".")
            .id({ type: "publicClassMember" }),
        id("super")
    )
).exit().end();

rule("argumentList").call("expression").split(
    char(",").optWhitespace().call("expression"),
    any()
).exit().end();

// ------------------------------- DANGER ZONE: DO NOT EDIT BELOW ------------------------------- \\

/**
 * Returns automaton. Evaluated at compile time.
 * @returns {[[[*, *, *]]]} - [match, next, stack]
 */
export function getAutomaton () {
    return getAutomatonTable();
}