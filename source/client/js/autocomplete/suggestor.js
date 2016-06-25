import { onUpdate as onInputUpdate, onKeyDown as onInputKeyDown, setHint } from "../input";
import { suggest } from "./index";
import { onInit } from "../init";
import * as server from "../server";

let sequence = 0,
    suggestions = [],
    variant = 0;

function updateSuggestion () {
    setHint(suggestions[variant] || "");
}

export function addSuggestions (forSequence, newSuggestions = []) {
    if (forSequence !== sequence)
        return; // deprecated variants arrived, exit
    if (!newSuggestions.length)
        return;
    suggestions = suggestions.concat(newSuggestions);
    console.log(`New suggestions:`, suggestions);
    updateSuggestion();
}

onInit(() => onInputUpdate((value = "", caretPos) => {
    let string = value.substring(0, caretPos),
        suggestion = suggest(string);
    console.log(`Suggestion:`, suggestion);
    ++sequence;
    variant = 0;
    suggestions = [];
    switch (suggestion.suggestion) {
        case "global": server.send(`GlobalAutocomplete`, {
            part: suggestion.keyString === "^" ? "" : suggestion.keyString,
            for: sequence
        }); break;
    }
    if (suggestion.suggestions.length)
        suggestions = suggestions.concat(suggestion.suggestions);
    updateSuggestion();
}));

onInit(() => onInputKeyDown((e) => {
    if (e.keyCode !== 18 || !suggestions.length) // alt
        return;
    let direction = e.code === "AltLeft" || e.location === 1 ? 1 : -1;
    variant = (variant + direction + suggestions.length) % suggestions.length;
    updateSuggestion();
    e.preventDefault();
}));