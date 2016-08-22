//  THIS MODULE IS INVOKED AT THE BUILD TIME. ANY ERRORS ARE REPORTED DURING THE GULP BUILD TASK  \\

export const
    // TYPE = 0 RESERVED
    TYPE_WHITESPACE = 1, // PRESERVED BY LOGIC
    TYPE_ID = 2, // PRESERVED BY LOGIC
    TYPE_STRING = 3, // PRESERVED BY LOGIC
    TYPE_CONSTANT = 4, // PRESERVED BY LOGIC
    TYPE_CHAR = 5, // PRESERVED BY LOGIC
    TYPE_EXIT = 6,
    TYPE_MERGE = 7,
    TYPE_ANY = 8,
    TYPE_CALL = 9,
    TYPE_BRANCH = 10,
    TYPE_OPT_WHITESPACE = 11,
    TYPE_TRY_CALL = 12,
    TYPE_ALL = 13,
    TYPE_NONE = 14,
    TYPE_SPLIT = 15;

let automaton = [
//    Current State | Current Symbol | Next State | Stack Control
//   ---------------|----------------|------------|---------------
//    0             | <noMatch>      | 2          | push 1
//    1             | {space}        | 0          |
//    ...
//   -------------------------------------------------------------
//   [                                    //  no matches => go to 2 => push 1 to stack
//      [null, 2, 1]
//   ],
//   [                                    //  matched whitespace => go to 0, error if no matches
//      [{ type: TYPE_WHITESPACE }, 0]
//   ],
//   [                                    //  match "do" or "d" identifier => go to 3
//      [{ type: TYPE_ID, value: "do" }, 3]
//      [{ type: TYPE_ID, value: "d" }, 3]
//   ],
//   ...
//   [                                    // match ",", go to 4 and send 15 to stack
//      [{ type: TYPE_CHAR, value: "," }, 4, 15]
//   ]
];

/**
 * Holds positions of assigned
 * @type {Object.<string, number>}
 */
let ruleMappings = { /* "doArgument": 5, "expression": 29, ... */ }; // used by rule() and call()

/**
 * New generated indices sometimes may cause automaton rows to be empty. This function filters an
 * empty rows.
 * @param {[[[]]]} a
 */
function optimize (a) {
    let automaton = a.slice();
    for (let a in automaton) {
        if (!automaton[a])
            continue;
        automaton[a] = automaton[a].slice();
        for (let b in automaton[a]) {
            automaton[a][b] = automaton[a][b].slice();
        }
    }
    automaton[0] = [[false, 0]]; // automaton first row always fails
    for (let i = 1; i < automaton.length; i++) {
        if (automaton[i])
            continue;
        for (let a in automaton) { // automaton[a] === row
            if (!automaton[a])
                continue;
            for (let b in automaton[a]) { // automaton[a][b] === cell
                if (parseInt(automaton[a][b][1]) > i)
                    automaton[a][b][1] -= 1;
                if (parseInt(automaton[a][b][2]) > i)
                    automaton[a][b][2] -= 1;
            }
        }
        automaton.splice(i, 1);
        i--;
    }
    return automaton;
}

export function getAutomatonTable () {
    return optimize(automaton);
}

export function getRuleMappings () {
    return ruleMappings;
}

function getTablePiece (thisArg) {
    return thisArg instanceof TablePiece ? thisArg : new TablePiece(true);
}

export function rule (ruleName) {
    let tp = new TablePiece();
    tp.ruleName = ruleName;
    return tp;
}

function TablePiece (built) {
    this.built = built || false;
    this.ruleName = "";
    this.chain = [];
}

function group (type) {
    return function (v) {
        let tp = getTablePiece(this);
        tp.chain.push({
            type: type,
            value: (type === TYPE_CHAR || type === TYPE_ID) && typeof v !== "object"
                ? typeof v === "undefined" ? {} : { value: v }
                : v
        });
        return tp;
    };
}

export let branch = TablePiece.prototype.branch = group(TYPE_BRANCH);
export let call = TablePiece.prototype.call = group(TYPE_CALL);
export let char = TablePiece.prototype.char = group(TYPE_CHAR);
export let string = TablePiece.prototype.string = group(TYPE_STRING);
export let id = TablePiece.prototype.id = group(TYPE_ID);
export let any = TablePiece.prototype.any = group(TYPE_ANY);
export let all = TablePiece.prototype.all = group(TYPE_ALL);
export let none = TablePiece.prototype.none = group(TYPE_NONE);
export let whitespace = TablePiece.prototype.whitespace = group(TYPE_WHITESPACE);
export let optWhitespace = TablePiece.prototype.optWhitespace = group(TYPE_OPT_WHITESPACE);
export let constant = TablePiece.prototype.constant = group(TYPE_CONSTANT);
export let tryCall = group(TYPE_TRY_CALL);
TablePiece.prototype.end = function () {
    if (!this.built)
        this.buildTable();
};
export let merge = TablePiece.prototype.merge = function () {
    let tp = getTablePiece(this);
    tp.chain.push({ type: TYPE_MERGE });
    if (!tp.built)
        tp.buildTable();
    return tp;
};
export let exit = TablePiece.prototype.exit = function () {
    let tp = getTablePiece(this);
    tp.chain.push({ type: TYPE_EXIT });
    if (!tp.built)
        tp.buildTable();
    return tp;
};
export let split = TablePiece.prototype.split = function () {
    let tp = getTablePiece(this),
        arr = [];
    for (let i = 0; i < arguments.length; i++) {
        arr.push(arguments[i].chain);
    }
    tp.chain.push({ type: TYPE_SPLIT, value: arr });
    return tp;
};

TablePiece.prototype.buildTable = function () {
    this.built = true;
    // console.log("Building table", this.ruleName, ":", this.chain);
    buildTable(this.ruleName, this.chain);
};

let currentIndex = 0;
function getNewIndex () {
    // console.log(`Getting new index ${currentIndex} -> ${currentIndex + 1}`);
    return ++currentIndex;
}

function getRuleIndex (rule) {
    if (!ruleMappings.hasOwnProperty(rule))
        ruleMappings[rule] = getNewIndex();
    return ruleMappings[rule];
}

function buildTable (rule, chain) {
    // console.log("Chain", chain);
    let left = processChain(chain, [], getRuleIndex(rule));
    if (left[0].length || left[1].length) {
        console.error("Not completed state. Stack", left[0], ", BackStack:", left[1]);
        throw new Error("There is a mistake in grammar definition. Please, make sure all chains are exited or looped.");
    }
    // printTable();
}

// function printTable () {
//     console.log(`Index\tTable`);
//     let table = [];
//     console.log(automaton);
//     let oa = optimize(automaton);
//     console.log(oa);
//     for (let i in oa) {
//         for (let r of oa[i]) {
//             table.push([+i].concat(r[0] ? (r[0].type + (r[0].value ? ` (${r[0].value})` : ""))
//                 : r[0]).concat(r.slice(1)));
//         }
//     }
//     if (console.table)
//         console.table(table);
//     console.log(oa);
// }

/**
 * Guarantees to return a cell.
 * @param {number} index
 * @returns {*}
 */
function getCell (index) {
    if (typeof automaton[index] === "undefined")
        automaton[index] = [];
    return automaton[index];
}

function processChain (chain, branchingStack, startingIndex) {
    let index = typeof startingIndex === "undefined" ? getNewIndex() : startingIndex,
        stack = [], // which rows are awaiting to be completed
        backStack = []; // which rows are awaiting to be completed with stack
    function completeStack (completeWith) {
        // console.log(index, "Attempt to complete stack");
        if (!stack.length)
            return;
        // console.log(index, "Completing Stack", stack);
        index = getNewIndex();
        stack.forEach(e => e[1] = typeof completeWith === "undefined" ? index : completeWith);
        stack = [];
    }
    function completeBackStack (completeWith) {
        // console.log(index, "Attempt to complete back stack");
        if (!backStack.length)
            return;
        // console.log(index, "Completing BackStack", stack);
        backStack.forEach(e => e[2] = typeof completeWith === "undefined" ? index : completeWith);
        backStack = [];
    }
    // console.log("Iterating over actual chain:", chain, `${chain.length}`);
    // console.log("Processing chain element", elem, `${ii}/${chain.length}`);
    for (let ii in chain) { let elem = chain[ii]; switch (elem.type) {
        case TYPE_CHAR:
        case TYPE_ID:
        case TYPE_CONSTANT:
        case TYPE_WHITESPACE:
        case TYPE_STRING: { // DONE
            completeStack();
            completeBackStack();
            let cell = getCell(index);
            // console.log(index, "Pushing primitive", elem);
            if (elem.value instanceof Array) {
                for (let v of elem.value) {
                    let e = [{ type: elem.type, value: v }];
                    cell.push(e);
                    stack.push(e);
                }
            } else {
                let e = [elem];
                cell.push(e);
                stack.push(e);
            }
        } break;
        case TYPE_OPT_WHITESPACE: {
            completeStack();
            completeBackStack();
            let e1 = [{ type: TYPE_WHITESPACE, value: undefined }],
                e2 = [null];
            getCell(index).push(e1, e2);
            stack.push(e1, e2);
        } break;
        case TYPE_ANY: { // DONE
            completeStack();
            completeBackStack();
            // console.log(index, "Pushing primitive", [null]);
            let e = [null];
            getCell(index).push(e);
            stack.push(e);
        } break;
        case TYPE_ALL:
        case TYPE_NONE: { // DONE
            completeStack();
            completeBackStack();
            // console.log(index, "Pushing primitive", [true]);
            let e = [elem.type === TYPE_ALL];
            getCell(index).push(e);
            stack.push(e);
        } break;
        case TYPE_BRANCH: { // DONE
            completeStack();
            completeBackStack();
            // console.log("Pushing", index, "to branching stack");
            branchingStack = branchingStack.concat(index);
        } break;
        case TYPE_MERGE: { // DONE
            let to = branchingStack.pop();
            // console.log("Getting", to, "from branching stack");
            if (typeof index === "undefined")
                throw new Error("Unmatched 'merge()': no matching 'branch()' in the chain.");
            // getCell(index).forEach(a => a[1] = to); // getCell(index)
            completeStack(to);
            completeBackStack(to);
        } break;
        case TYPE_SPLIT: { // DONE
            completeStack();
            completeBackStack();
            // console.log(index, "SPLITTING", elem.value);
            for (let c of elem.value) {
                let temp = processChain(c, branchingStack, index);
                // console.log("GOT BACK", temp);
                stack = stack.concat(temp[0]);
                backStack = backStack.concat(temp[1]);
            }
            // console.log("stack:", stack, "backStack:", backStack);
        } break;
        case TYPE_CALL: { // DONE
            // console.log(index, "CALLING ", elem.value, `(-> ${ ruleMappings[elem.value] })`);
            if (stack.length) {
                // console.log("MOVING ", stack, "TO BACKSTACK");
                backStack = backStack.concat(stack);
                completeStack(getRuleIndex(elem.value));
            } else {
                let e = [null, getRuleIndex(elem.value)];
                // console.log("MOVING ", e, "TO BACKSTACK");
                getCell(index).push(e);
                backStack.push(e);
                index = getNewIndex();
            }
        } break;
        case TYPE_TRY_CALL: { // DONE
            // console.log(index, "TRY CALLING ", elem.value, `(-> ${ ruleMappings[elem.value] })`);
            if (stack.length) { // exceptional case
                // console.log(`[!] tryCall() potential invalid usage, check the grammar chain.`);
                completeStack();
                completeBackStack();
            }
            let e = [0, getRuleIndex(elem.value)];
            // console.log("MOVING ", e, "TO BACKSTACK");
            getCell(index).push(e);
            backStack.push(e);
            index = getNewIndex();
        } break;
        case TYPE_EXIT: { // DONE
            // console.log("EXITING, stack:", stack, ", backStack:", backStack);
            completeStack(0);
            completeBackStack(0);
        } break;
    }}
    return [stack, backStack];
}