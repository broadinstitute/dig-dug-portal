/**
 * Shared LLM JSON repair helpers.
 *
 * Models often emit near-JSON with prose quoting mistakes (raw `"…"` inside
 * strings), smart quotes, trailing commas, comments, or literal newlines in
 * strings. These utilities are intentional salvage — not full JSON5.
 *
 * Safe to import from any portal / agent project that needs resilient LLM JSON.
 */

const SMART_DOUBLE_QUOTES = /[\u201C\u201D\u201E\u201F\u2033\u2036]/g;
const SMART_SINGLE_QUOTES = /[\u2018\u2019\u201A\u201B\u2032\u2035]/g;

/**
 * @param {string} text
 * @returns {{ text: string, applied: boolean }}
 */
export function normalizeSmartQuotes(text) {
    const src = String(text || "");
    const next = src.replace(SMART_DOUBLE_QUOTES, '"').replace(SMART_SINGLE_QUOTES, "'");
    return { text: next, applied: next !== src };
}

/**
 * Remove // line comments and slash-star block comments outside of strings.
 * @param {string} text
 * @returns {{ text: string, applied: boolean }}
 */
export function stripJsonComments(text) {
    const s = String(text || "");
    let out = "";
    let i = 0;
    let inString = false;
    let escape = false;
    let applied = false;

    while (i < s.length) {
        const c = s[i];
        const next = s[i + 1];

        if (inString) {
            out += c;
            if (escape) {
                escape = false;
            } else if (c === "\\") {
                escape = true;
            } else if (c === '"') {
                inString = false;
            }
            i += 1;
            continue;
        }

        if (c === '"') {
            inString = true;
            out += c;
            i += 1;
            continue;
        }

        if (c === "/" && next === "/") {
            applied = true;
            i += 2;
            while (i < s.length && s[i] !== "\n" && s[i] !== "\r") i += 1;
            continue;
        }

        if (c === "/" && next === "*") {
            applied = true;
            i += 2;
            while (i < s.length - 1 && !(s[i] === "*" && s[i + 1] === "/")) i += 1;
            i = Math.min(i + 2, s.length);
            continue;
        }

        out += c;
        i += 1;
    }

    return { text: out, applied };
}

/**
 * Remove trailing commas before } or ].
 * @param {string} text
 * @returns {{ text: string, applied: boolean }}
 */
export function stripTrailingCommas(text) {
    const src = String(text || "");
    const next = src.replace(/,(\s*[}\]])/g, "$1");
    return { text: next, applied: next !== src };
}

function isStructuralAfterString(ch) {
    return ch === "," || ch === "}" || ch === "]" || ch === ":";
}

function peekNonWs(s, from) {
    let j = from;
    while (j < s.length && /\s/.test(s[j])) j += 1;
    return { index: j, char: j < s.length ? s[j] : "" };
}

/**
 * Escape raw control characters inside JSON strings (literal newline/tab/etc.).
 * Leaves already-escaped sequences alone.
 * @param {string} text
 * @returns {{ text: string, applied: boolean }}
 */
export function escapeRawControlsInStrings(text) {
    const s = String(text || "");
    let out = "";
    let i = 0;
    let inString = false;
    let escape = false;
    let applied = false;

    while (i < s.length) {
        const c = s[i];
        if (!inString) {
            if (c === '"') inString = true;
            out += c;
            i += 1;
            continue;
        }

        if (escape) {
            out += c;
            escape = false;
            i += 1;
            continue;
        }

        if (c === "\\") {
            out += c;
            escape = true;
            i += 1;
            continue;
        }

        if (c === '"') {
            inString = false;
            out += c;
            i += 1;
            continue;
        }

        if (c === "\n") {
            out += "\\n";
            applied = true;
        } else if (c === "\r") {
            out += "\\r";
            applied = true;
        } else if (c === "\t") {
            out += "\\t";
            applied = true;
        } else if (c === "\b") {
            out += "\\b";
            applied = true;
        } else if (c === "\f") {
            out += "\\f";
            applied = true;
        } else if (c.charCodeAt(0) < 0x20) {
            out += `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`;
            applied = true;
        } else {
            out += c;
        }
        i += 1;
    }

    return { text: out, applied };
}

/**
 * Escape unescaped `"` that appear inside string values (prose emphasis),
 * e.g. `recognized as "altered-self" by …`.
 *
 * A quote ends a string only when the next non-whitespace character is
 * structural (`,` `}` `]` `:`) or end-of-input.
 *
 * @param {string} text
 * @returns {{ text: string, applied: boolean }}
 */
export function escapeInteriorUnescapedQuotes(text) {
    const s = String(text || "");
    let out = "";
    let i = 0;
    let inString = false;
    let escape = false;
    let applied = false;

    while (i < s.length) {
        const c = s[i];

        if (!inString) {
            if (c === '"') inString = true;
            out += c;
            i += 1;
            continue;
        }

        if (escape) {
            out += c;
            escape = false;
            i += 1;
            continue;
        }

        if (c === "\\") {
            out += c;
            escape = true;
            i += 1;
            continue;
        }

        if (c === '"') {
            const { char: next } = peekNonWs(s, i + 1);
            if (!next || isStructuralAfterString(next)) {
                inString = false;
                out += '"';
            } else {
                out += '\\"';
                applied = true;
            }
            i += 1;
            continue;
        }

        out += c;
        i += 1;
    }

    return { text: out, applied };
}

/**
 * Convert simple single-quoted JSON-like strings to double-quoted form when
 * the whole token is `'…'` (keys or values). Skips apostrophes mid-word.
 * Runs only outside double-quoted strings.
 *
 * @param {string} text
 * @returns {{ text: string, applied: boolean }}
 */
export function convertSingleQuotedStrings(text) {
    const s = String(text || "");
    let out = "";
    let i = 0;
    let inDouble = false;
    let escape = false;
    let applied = false;

    while (i < s.length) {
        const c = s[i];

        if (inDouble) {
            out += c;
            if (escape) {
                escape = false;
            } else if (c === "\\") {
                escape = true;
            } else if (c === '"') {
                inDouble = false;
            }
            i += 1;
            continue;
        }

        if (c === '"') {
            inDouble = true;
            out += c;
            i += 1;
            continue;
        }

        if (c === "'") {
            let j = i + 1;
            let inner = "";
            let closed = false;
            while (j < s.length) {
                const ch = s[j];
                if (ch === "\\") {
                    inner += ch + (s[j + 1] || "");
                    j += 2;
                    continue;
                }
                if (ch === "'") {
                    closed = true;
                    j += 1;
                    break;
                }
                if (ch === "\n" || ch === "\r") break;
                inner += ch;
                j += 1;
            }
            if (closed) {
                const escaped = inner.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
                out += `"${escaped}"`;
                applied = true;
                i = j;
                continue;
            }
        }

        out += c;
        i += 1;
    }

    return { text: out, applied };
}

/**
 * Apply a conservative sequence of LLM JSON repairs.
 *
 * @param {string} text - Candidate JSON text (already fence-stripped if needed)
 * @returns {{ text: string, repairs: string[] }}
 */
export function repairLlmJsonText(text) {
    let current = String(text || "");
    const repairs = [];

    const steps = [
        ["smart_quotes", normalizeSmartQuotes],
        ["strip_comments", stripJsonComments],
        ["single_quoted_strings", convertSingleQuotedStrings],
        ["interior_unescaped_quotes", escapeInteriorUnescapedQuotes],
        ["raw_controls_in_strings", escapeRawControlsInStrings],
        ["trailing_commas", stripTrailingCommas],
    ];

    for (const [name, fn] of steps) {
        const { text: next, applied } = fn(current);
        if (applied) {
            repairs.push(name);
            current = next;
        }
    }

    return { text: current, repairs };
}

/**
 * Try JSON.parse, then repair + parse again on failure.
 *
 * @param {string} text
 * @returns {{ ok: boolean, json: any, parseError: Error|null, repaired: boolean, repairs: string[] }}
 */
export function tryParseJsonWithRepair(text) {
    const raw = String(text || "");
    try {
        return {
            ok: true,
            json: JSON.parse(raw),
            parseError: null,
            repaired: false,
            repairs: [],
        };
    } catch (firstError) {
        const { text: fixed, repairs } = repairLlmJsonText(raw);
        if (!repairs.length || fixed === raw) {
            return {
                ok: false,
                json: null,
                parseError: firstError instanceof Error ? firstError : new Error(String(firstError)),
                repaired: false,
                repairs: [],
            };
        }
        try {
            return {
                ok: true,
                json: JSON.parse(fixed),
                parseError: null,
                repaired: true,
                repairs,
            };
        } catch (secondError) {
            return {
                ok: false,
                json: null,
                parseError: secondError instanceof Error ? secondError : new Error(String(secondError)),
                repaired: true,
                repairs,
            };
        }
    }
}
