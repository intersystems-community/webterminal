import { getAutomaton } from "../parser";
import {
    TYPE_ID,
    TYPE_CHAR
} from "../parser/pushdownAutomaton";
import { onInit } from "../init";
import * as input from "../input";
import hint from "./hint";

export function suggest (state, base = "") {
    const BEEN = [],
        automaton = getAutomaton();
    // console.log(`Suggesting from state ${ state } with "${ base }"`);
    // match null | TYPE_CHAR (multiple) | TYPE_ID (once)
    function collect (state, base, cls = null, type = null) {
        if (BEEN[state]) // prevent looping
            return [];
        BEEN[state] = true;
        let rule = automaton[state],
            arr = [];
        if (!rule) {
            console.error(`No state ${ state }`);
            return [];
        }
        for (let row of rule) {
            if (row[0] === null) {
                if (row[1] === 0)
                    break;
                arr = arr.concat(collect(row[1], base));
                break;
            }
            if (row[0] === true || row[0] === 0)
                continue;
            if (row[0].type !== TYPE_CHAR && row[0].type !== TYPE_ID)
                continue;
            if (cls && row[0].value.class && row[0].value.class !== cls
                || type && row[0].value.type && row[0].value.type !== type)
                continue;
            if (row[0].type === TYPE_CHAR) {
                if (base !== "" && row[0].value.value.indexOf(base) !== 0)
                    continue;
                if (row[1] === 0)
                    continue;
                let a = collect(
                    row[1],
                    base.substr(1),
                    row[0].value.class || cls,
                    row[0].value.type || type
                );
                for (let r of a)
                    if (r[0] && r[0].value) // suggest only / ids with value
                        arr.push([ row[0].value ].concat(r));
            }
            if (row[0].type === TYPE_ID) {
                if (base !== "" && typeof row[0].value.value === "string") {
                    if (row[0].value.value.indexOf(base) === 0) {
                        arr.push([{
                            value: row[0].value.value.substr(base.length),
                            class: row[0].value.class,
                            type: row[0].value.type
                        }]);
                    } // else continue (default)
                } else {
                    arr.push([ row[0].value ]);
                }
            }
        }
        return arr;
    }
    return collect(state, base);
}

onInit(() => input.onKeyDown((e) => {
    if (e.keyCode === 17) { // CTRL
        if (!hint.visible)
            return;
        hint.next(e.location === 2 ? -1 : 1);
    } else if (e.keyCode === 9) { // TAB
        e.preventDefault();
        if (!hint.visible)
            return;
        let val = input.getValue(),
            pos = input.getCaretPosition(),
            v = hint.get();
        input.setValue(val.substr(0, pos) + v + val.substr(pos), pos + v.length);
    }
}));

export function showSuggestions (show, suggestions = []) {

    let s = suggestions.filter(s => !!s[0].value).map(arr => arr.map(e => e.value).join(""));
    if (show && s.length) {
        hint.add(s);
        hint.show();
    } else {
        hint.hide();
    }

}