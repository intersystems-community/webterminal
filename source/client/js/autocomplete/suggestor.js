import * as input from "../input";
import { suggest } from "./index";
import { onInit } from "../init";
import { input as inputElement } from "../elements";
import * as server from "../server";

let sequence = 0,
    suggestions = [],
    variant = 0;

function updateSuggestion () {
    input.setHint(suggestions[variant] || "");
}

export function addSuggestions (forSequence, newSuggestions = []) {
    if (forSequence !== sequence)
        return; // deprecated variants arrived, exit
    if (!newSuggestions.length)
        return;
    suggestions = suggestions.concat(newSuggestions);
    // console.log(`New suggestions:`, suggestions);
    updateSuggestion();
}

function suggestByString (value = "", caretPos) {
    let string = value.substring(0, caretPos),
        suggestion = suggest(string);
    ++sequence;
    variant = 0;
    suggestions = [];
    switch (suggestion.suggestion) {
        case "global": server.send(`GlobalAutocomplete`, {
            part: suggestion.keyString === "^" ? "" : suggestion.keyString,
            for: sequence
        }); break;
        case "className": server.send(`ClassAutocomplete`, {
            part: suggestion.keyString === "(" ? "" : suggestion.keyString,
            for: sequence
        }); break;
    }
    if (suggestion.suggestions.length)
        suggestions = suggestions.concat(suggestion.suggestions);
    updateSuggestion();
}

onInit(() => input.onUpdate(suggestByString));

/// ALT key handler
onInit(() => input.onKeyDown((e) => {
    if (e.keyCode !== 18 || !suggestions.length)
        return;
    let direction = e.code === "AltLeft" || e.location === 1 ? 1 : -1;
    variant = (variant + direction + suggestions.length) % suggestions.length;
    updateSuggestion();
    e.preventDefault();
}));

/// TAB key handler
onInit(() => input.onKeyDown((e) => {
    if (e.keyCode !== 9)
        return;
    e.preventDefault();
    if (!suggestions.length || !suggestions[variant])
        return;

    let caretPos = input.getCaretPosition();
    inputElement.value = inputElement.value.substring(0, caretPos) + suggestions[variant]
        + inputElement.value.substring(caretPos, inputElement.value.length);
    input.setCaretPosition(caretPos + suggestions[variant].length);
    input.setHint("");
    suggestByString(inputElement.value, input.getCaretPosition());

    variant = 0;
    suggestions = [];
}));