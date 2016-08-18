import { suggest } from "../autocomplete";

import {
    TYPE_WHITESPACE,
    TYPE_ID,
    TYPE_STRING,
    TYPE_CONSTANT,
    TYPE_CHAR
} from "./pushdownAutomaton";

const
    LEXEMES_SPLIT =
        /([\s\t]+)|([a-z]+[a-z0-9]*)|("(?:"(?=")"|[^"])*(?:"|$))|([0-9]*\.[0-9]+|[0-9]+)|([^])/gi,
    DEFAULT_CLASSES = ["", "", "string", "constant", ""];

let wrap = (a) => a,
    automaton = wrap(/* @echo autocompleteAutomaton */),
    rules = wrap(/* @echo ruleMappings */); // { "CWTSpecial": 1, "rule": state }

export function getAutomaton () {
    return automaton;
}
// printAutomaton(automaton);
// function printAutomaton (oa) {
//     if (!oa)
//         return;
//     let table = [];
//     console.log(oa);
//     for (let i in oa) {
//         if (!oa[i])
//             continue;
//         for (let r of oa[i]) {
//             table.push([+i].concat(r[0] ? (r[0].type + (r[0].value ? ` (${r[0].value.value || r[0].value})` : ""))
//                 : r[0]).concat(r.slice(1)));
//         }
//     }
//     if (console.table)
//         console.table(table);
//     console.log(rules);
// }

/**
 * Split the string to the lexical parts. There are five: whitespace, id, string, constant and char.
 * @param {string} string
 * @returns {{ type: number, value: *, class: string }[]}
 */
function splitString (string) {
    let matches,
        result = [];
    while ((matches = LEXEMES_SPLIT.exec(string)) !== null) {
        for (let i = 1; i < matches.length; i++) {
            if (matches[i]) {
                result.push({
                    type: i,
                    value: matches[i],
                    class:  DEFAULT_CLASSES[i - 1] || ""
                });
                break;
            }
        }
    }
    LEXEMES_SPLIT.lastIndex = 0;
    return result;
}

/**
 * State machine processes the string.
 * @param {string} string - String to process.
 * @param cursorPos - Cursor position in this string. Has influence on autocomplete suggestions.
 * @returns {{lexemes: {type: number, value: *, class: string}[], suggestions: *}}
 */
export function process (string, cursorPos = string.length) {
    let tape = splitString(string),
        stack = [], // holds state numbers
        tryStack = [],
        INITIAL_STATE = 1,
        parsedStringLength = 0,
        state = INITIAL_STATE,
        pos = 0,
        maxPos = 0,
        ruleIndex = 0,
        whiteSpaceMatched = false,
        lastSucceededState = state,
        suggestState = 0,
        collector = [], // collects all IDs which have "type"
        lastErrorAt = -1, // pos in tape, not in string
        count = 0,
        MAX_LOOP = 100,
        subString = "";
    // console.log("-----------");
    function error () {
        if (lastErrorAt < pos) {
            lastErrorAt = pos;
        }
        // console.log(`${ state } (${parsedStringLength}/${string.length}) | Errored at ${ pos } (lastErroredAt=${ lastErrorAt })`);
        if (!tryStack.length) {
            return true;
        }
        // console.log(`${ state } (${parsedStringLength}/${string.length}) | [${ (tape[pos] || {}).value }] Popping tryStack with`, tryStack[tryStack.length - 1]);
        let letsTry = tryStack.pop();
        state = letsTry[0];
        ruleIndex = letsTry[1] + 1;
        if (stack.length > letsTry[2]) {
            stack = stack.slice(0, letsTry[2]);
        }
        parsedStringLength = letsTry[3];
        pos = letsTry[4];
        if (!suggestState && collector.length > letsTry[5]) {
            collector = collector.slice(0, letsTry[5]);
        }
        // console.log(`${ state } (${parsedStringLength}/${string.length}) | [${ (tape[pos] || {}).value }] Now stack is`, stack.slice());
        return false;
    }
    while (pos < tape.length && count++ < MAX_LOOP) {
        if (typeof automaton[state] === "undefined") {
            console.warn("No state", automaton[state]);
            state = INITIAL_STATE;
        }
        if (pos > maxPos) { // apply restriction to avoid freezing terminal in case of wrong grammar
            maxPos = pos;
            count = 0;
        }
        let ok = false,
            startFromState = state,
            startSub;
        // console.log(`${ state } (${parsedStringLength}/${string.length}) | [${ tape[pos].value
        //     }] Begin look through the rule. [ruleIndex = ${ ruleIndex }] Stack`, stack.slice());
        for (; ruleIndex < automaton[state].length; ruleIndex++) {
            let rule = automaton[state][ruleIndex],
                lexeme = tape[pos];
            // console.log(
            //     `${ state } (${parsedStringLength}/${string.length}) | Rule [${ rule[0] }, ${ typeof rule[1] !== "undefined" ? rule[1] : "_"
            //     }, ${ typeof rule[2] !== "undefined" ? rule[2] : "_" }], lex =`,
            //     `${ lexeme.value } [ruleIndex = ${ ruleIndex }]`
            // );
            if (rule[0] === null) {
                pos--;
            } else if (rule[0] === false) {
                // match none
                // if (typeof lexeme.value === "string")
                //     parsedStringLength += lexeme.value.length;
                break;
            } else if (rule[0] === true) {
                // match all
                if (lexeme.type === TYPE_WHITESPACE)
                    whiteSpaceMatched = true;
                if (typeof lexeme.value === "string")
                    parsedStringLength += lexeme.value.length;
            } else if (rule[0] === 0) { // try call
                tryStack.push([state, ruleIndex, stack.length, parsedStringLength, pos, collector.length]);
                // console.log(
                //     `${ state } (${parsedStringLength}/${string.length}) | Pushing to tryStack `, tryStack[tryStack.length - 1] ,` [ruleIndex = ${ ruleIndex }]`
                // );
                pos--;
            } else if (rule[0].type === TYPE_WHITESPACE) {
                if (whiteSpaceMatched) {
                    pos--;
                    // change lexeme as well?
                } else {
                    if (rule[0].type !== lexeme.type)
                        continue;
                    if (typeof lexeme.value === "string")
                        parsedStringLength += lexeme.value.length;
                }
                whiteSpaceMatched = true;
            } else if (rule[0].type === TYPE_ID) {
                if (rule[0].type !== lexeme.type)
                    continue;
                if (parsedStringLength < cursorPos && cursorPos < parsedStringLength + lexeme.value.length) {
                    subString = lexeme.value.substr(0, cursorPos - parsedStringLength);
                }
                if (typeof rule[0].value === "string") {
                    if (lexeme.value !== rule[0].value)
                        continue;
                } else if (
                    typeof rule[0].value === "object" && typeof rule[0].value.value !== "undefined"
                ) {
                    if (lexeme.value !== rule[0].value.value)
                        continue;
                }
                if (typeof lexeme.value === "string")
                    parsedStringLength += lexeme.value.length;
                // when rule[0].value is object and no rule[0].value.value is set, we match any ID
                startSub = lexeme.value;
                whiteSpaceMatched = false;
            } else if (rule[0].type === TYPE_STRING) {
                if (rule[0].type !== lexeme.type)
                    continue;
                if (typeof lexeme.value === "string")
                    parsedStringLength += lexeme.value.length;
                whiteSpaceMatched = false;
            } else if (rule[0].type === TYPE_CONSTANT) {
                if (rule[0].type !== lexeme.type)
                    continue;
                if (typeof lexeme.value === "string")
                    parsedStringLength += lexeme.value.length;
                whiteSpaceMatched = false;
            } else if (rule[0].type === TYPE_CHAR) {
                if (rule[0].type !== lexeme.type)
                    continue;
                if (typeof rule[0].value === "string") {
                    if (lexeme.value !== rule[0].value)
                        continue;
                } else if (
                    typeof rule[0].value === "object" && typeof rule[0].value.value !== "undefined"
                ) {
                    if (lexeme.value !== rule[0].value.value)
                        continue;
                }
                if (typeof lexeme.value === "string")
                    parsedStringLength += lexeme.value.length;
                // when rule[0].value is object and no rule[0].value.value is set, we match any CHAR
                whiteSpaceMatched = false;
            }
            // ...
            // console.log(`${ state } (${parsedStringLength}/${string.length}) | [${ lexeme.value }] Match found [ruleIndex = ${ ruleIndex }]`);
            if (rule[0] && typeof rule[0].value === "object") {
                if (rule[0].value.class)
                    lexeme.class = rule[0].value.class;
                if (!suggestState) {
                    if (rule[0].value.type && rule[0].value.type !== "*") {
                        collector.push({
                            type: rule[0].value.type,
                            value: lexeme.value
                        });
                    } else if (rule[0].value.type === "*") {

                    } else if (!collector[collector.length - 1] || collector[collector.length - 1].type !== ",") {
                        collector.push({
                            type: ",",
                            value: ""
                        });
                    }
                }
            }
            if (typeof rule[2] !== "undefined") {
                // console.log(`${ state } (${parsedStringLength}/${string.length}) | [${ lexeme.value }] Pushing ${ rule[2] } to stack [ruleIndex = ${ ruleIndex }]`);
                stack.push(rule[2]);
            }
            if (rule[1] === 0) {
                while (true) {
                    // console.log(`${ state } (${parsedStringLength}/${string.length}) | [${ lexeme.value }] Popping stack...`, stack.slice());
                    state = stack.pop();
                    if (tryStack.length && tryStack[tryStack.length - 1][2] === stack.length) {
                        // console.log(`${ state } (${parsedStringLength}/${string.length}) | Freeing tryStack as tried rule normally exited`, tryStack[tryStack.length - 1]);
                        tryStack.pop(); // free tryStack
                    }
                    if (state !== 0)
                        break;
                }
                if (typeof state === "undefined")
                    state = 0; // forever loop
                // console.log(`${ state } (${parsedStringLength}/${string.length}) | [${ lexeme.value }] Now stack is`, stack.slice());
            } else {
                state = rule[1];
                // console.log(`${ state } (${parsedStringLength}/${string.length}) | [${ lexeme.value }] Moving to state ${ state }`);
            }
            pos++;
            ok = true;
            break;
        }
        if (!ok) {
            // console.log(
            //     `${ state } (${parsedStringLength}/${string.length}) | [${ (tape[pos] || {}).value || "" }] Finalized, not OK; pos = ${ pos + 1 }/${ tape.length
            //     } [ruleIndex = ${ ruleIndex }]`
            // );
            if (error()) { // not the last - predict
                ruleIndex = 0;
                state = 0;
                whiteSpaceMatched = false;
                if (tape[pos]) {
                    if (typeof tape[pos].value === "string")
                        parsedStringLength += tape[pos].value.length;
                    // console.log(`Error at pos=${pos}`);
                    if (lastErrorAt <= pos) {
                        tape[pos].class = "error";
                    }
                    pos++;
                }
                // console.log(
                //     `[!]  (${parsedStringLength}/${string.length}) Missing rule for`, (tape[pos] || { value: tape[pos] }).value || "",
                //     `at state ${ state }. Stack:`, stack, `TryStack:`, tryStack
                // );
                stack = [];
                tryStack = [];
                let nextLength = tape[pos] ? tape[pos].value.length : 1;
                // console.log(`!suggestState && parsedStringLength <= cursorPos && cursorPos < parsedStringLength + nextLength`);
                // console.log(`!${suggestState} && ${parsedStringLength} <= ${cursorPos} && ${cursorPos} < ${parsedStringLength} + ${nextLength}`);
                if (!suggestState && parsedStringLength <= cursorPos && cursorPos < parsedStringLength + nextLength && tape[pos - 1] && tape[pos - 1].type === TYPE_ID) {
                    // console.log(`Setting suggestState=${lastSucceededState} as it wasn't set until the end. lastErrorAt=${lastErrorAt}, pos=${pos}`);
                    suggestState = lastSucceededState;
                    if (pos - 1 === lastErrorAt) {
                        subString = tape[pos - 1].value;
                    }
                }
            }
        } else {
            let nextLength = tape[pos] ? tape[pos].value.length : 1;
            // console.log(`Now OK`);
            // console.log(`${ state } (${parsedStringLength}/${string.length}) | Try to set suggestState, ${pos} > ${lastErrorAt} && ${parsedStringLength} <= ${cursorPos} < ${parsedStringLength+nextLength}`);
            if (pos > lastErrorAt) {
                // console.log(`lastSucceededState = state (${lastSucceededState} = ${state})`);
                lastSucceededState = state;
                // console.log(`${ state } (${parsedStringLength}/${string.length}) | Setting lastSucceeded state to ${state}`);
            }
            ruleIndex = 0;
            if (pos > lastErrorAt && parsedStringLength <= cursorPos && cursorPos < parsedStringLength + nextLength) {
                // console.log(`${ state } | [${ (tape[pos] || {}).value || "" }] Setting suggestState=${lastSucceededState} as ${parsedStringLength} <= ${cursorPos} < ${parsedStringLength+nextLength}`);
                // console.log(`suggestState = lastSucceededState (${suggestState} = ${lastSucceededState})`);
                suggestState = tape[pos - 1] && tape[pos - 1].type === TYPE_ID ? startFromState : lastSucceededState;
                if (startSub)
                    subString = startSub;
            }
            // console.log(`${ state } (${parsedStringLength}/${string.length}) | [${ (tape[pos] || {}).value || "" }] Finalized, OK! [ruleIndex = ${ ruleIndex }] Parsed=${ parsedStringLength }/${ string.length }`);
        }
    }
    // if (!suggestState) {
    //     // console.log(`Setting suggestState=${lastSucceededState} as it wasn't set until the end. lastErrorAt=${lastErrorAt}, pos=${pos}`);
    //     suggestState = lastSucceededState;
    //     if (!subString && pos - 1 === lastErrorAt && tape[pos - 1] && tape[pos - 1].type === TYPE_ID) {
    //         subString = tape[pos - 1].value;
    //     }
    // }
    if (count >= MAX_LOOP) {
        console.error(`Statement`, tape, `looped more than ${ MAX_LOOP } times without a progress, exiting.`);
    }
    // console.log(
    //     ` (${parsedStringLength}/${string.length}) Complete! My state is ${ state }. Last succeeded state is ${ lastSucceededState
    //     }. Stack:`, stack, `Try Stack:`, tryStack);
    // console.log(`Tape:`, tape);
    // console.log(`Parsed length: ${ parsedStringLength } of actual length ${ string.length }. Suggest state: ${ suggestState }`);
    if (parsedStringLength !== string.length) {
        console.error(`Oops, you've caught a rare exception! parsedStringLength != string.length (${
            parsedStringLength } != ${ string.length }) for '${ string
            }'. Please, report this issue.`);
    }
    return {
        lexemes: tape,
        suggestions: suggestState === 0 ? [] : suggest(suggestState, subString),
        collector: collector
    };
}