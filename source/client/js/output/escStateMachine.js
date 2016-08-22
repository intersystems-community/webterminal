import esc from "./esc";

let stateTree = {};

function registerSequence (seq = "", f) {

    let seqPos = 0,
        pos, r, tree = stateTree;

    while (seqPos < seq.length) {
        if (seq[seqPos] === "{" && (pos = seq.indexOf("}", seqPos)) !== -1) {
            try {
                r = new RegExp(seq.substring(seqPos + 1, pos));
            } catch (e) { console.error(`Malformed RegExp in "${ seq }" pattern.`, e); continue; }
            seqPos = pos + 1;
            tree = (tree[""] = tree[""] ? tree[""] : {})[r.source] =
                seqPos < seq.length ? (tree[""][r.source] ? tree[""][r.source] : {}) : f;
            continue;
        }
        tree = tree[seq[seqPos]] =
            seqPos + 1 < seq.length ? (tree[seq[seqPos]] ? tree[seq[seqPos]] : {}) : f;
        seqPos++;
    }

}

for (let seq in esc) {
    registerSequence(seq, esc[seq]);
}

export const ESC_CHARS_MASK = /[\x00-\x1F]/;

function getMatched (o, str, args = []) {
    // console.log(`Diving with ${str} (${ str.length })`);
    if (!str)
        return 0;
    let a, m = -1, n, l;
    if (o[str[0]]) {
        if (typeof o[str[0]] === "function") {
            o[str[0]](args);
            // console.log(`Function found`);
            return 1;
        }
        m = getMatched(o[str[0]], str.substr(1), args);
        if (m > 0) {
            // console.log(`Sub-obj found`);
            return 1 + m;
        }
    }
    for (let p in o[""]) {
        if (a = str.match(`^${ p }`)) {
            // console.log(`Match found ${ p }`);
            n = getMatched(o[""][p], str.substr(l = a.join().length), args.concat(a));
            if (n > 0)
                return n + l;
            m = n > m ? n : m;
        }
    }
    if (m < 0) {
        // console.log(`Nothing found, end reached`);
        return -1;
    }
    // console.log(`Nothing found`);
    return m;
}

/**
 * This function takes the string which begins from any registered escape sequence.
 * @see esc.js
 * It tries to parse and execute escape sequences that were found.
 * If escape sequence matches, the function processes it and returns the string without the
 * sequence. If no escape sequence matches it returns the input string without changes.
 * @returns {string} - Returns THE SAME STRING if more characters is needed in order to process
 *                     sequence.
 */
export function applyEscapeSequence (string = "") {
    let l = getMatched(stateTree, string);
    // console.log(`Input: ${ string }, getMatched: ${ l }`);
    return l === -1 ? string.substr(1) // unknown escape sequence, just remove esc character
        : l === 0 ? string // need more characters, wait
        : string.substr(l); // rest of the string
}

// todo: test and delete
window.applyEscapeSequence = applyEscapeSequence;