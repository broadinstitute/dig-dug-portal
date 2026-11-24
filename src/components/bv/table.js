// What b-table does with its fields and items, as BootstrapVue 2.23 does it.
import { warn } from "vue";

const isObject = (value) => value !== null && typeof value === "object";

// keys of an item that are for the table
const OWN_KEYS = ["_cellVariants", "_rowVariant", "_showDetails"];

// Keys that BootstrapVue knows and nothing in PanKbase uses.
const UNSUPPORTED = {
    field: [
        "headerAbbr",
        "headerTitle",
        "isRowHeader",
        "labelHtml",
        "sortByFormatted",
        "sortDirection",
        "sortKey",
        "stickyColumn",
        "tdAttr",
        "thAttr",
        "variant",
    ],
    item: ["_cellVariants", "_rowVariant"],
};
const reported = new Set();

// Development only: warns once about each.
export function checkKeys(kind, list) {
    const report = (name) => {
        const message = `[bv] <b-table> does not support the ${kind} key "${name}"`;
        if (!reported.has(message)) {
            reported.add(message);
            warn(message);
        }
    };
    for (const one of list.filter(isObject)) {
        UNSUPPORTED[kind].filter((key) => one[key]).forEach(report);
        if (kind === "field" && typeof one.key !== "string") {
            report(Object.keys(one).join());
        }
        // the name of a method of the parent
        if (kind === "field" && typeof one.formatter === "string") {
            report(`formatter: "${one.formatter}"`);
        }
    }
}

export function startCase(text) {
    return text
        .replace(/_/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(
            /(\s|^)(\w)/g,
            (all, space, letter) => space + letter.toUpperCase()
        );
}

// One object per column, with a key and a label; from the first item if there are none.
export function normalizeFields(fields, items) {
    const list = [];
    for (const field of Array.isArray(fields) ? fields : []) {
        if (field && typeof field === "string") {
            list.push({ key: field });
        } else if (
            isObject(field) &&
            field.key &&
            typeof field.key === "string"
        ) {
            list.push({ ...field });
        }
    }
    if (list.length === 0 && items.length > 0) {
        for (const key of Object.keys(items[0])) {
            if (!OWN_KEYS.includes(key)) {
                list.push({ key });
            }
        }
    }
    const seen = new Set();
    return list.filter((field) => {
        if (seen.has(field.key)) {
            return false;
        }
        seen.add(field.key);
        if (typeof field.label !== "string") {
            field.label = startCase(field.key);
        }
        return true;
    });
}

// `path` is a key of the item, or else the way to a value inside it: "nested.list[0]"
export function get(item, path, otherwise) {
    if (!isObject(item)) {
        return otherwise;
    }
    if (path in item) {
        return item[path] ?? otherwise;
    }
    let value = item;
    for (const step of path
        .replace(/\[(\d+)]/g, ".$1")
        .split(".")
        .filter(Boolean)) {
        value = isObject(value) && step in value ? value[step] : null;
        if (value === null || value === undefined) {
            return otherwise;
        }
    }
    return value;
}

export function toText(value) {
    if (value === null || value === undefined) {
        return "";
    }
    const { toString } = Object.prototype;
    return Array.isArray(value) ||
        (toString.call(value) === "[object Object]" &&
            value.toString === toString)
        ? JSON.stringify(value, null, 2)
        : String(value);
}

// all values inside an object as one text
function flatten(value) {
    if (isObject(value) && !(value instanceof Date)) {
        return Object.keys(value)
            .sort()
            .map((key) => flatten(value[key]))
            .filter(Boolean)
            .join(" ");
    }
    return toText(value);
}

// All values of an item are searched, also those that are in no column.
export function filterItems(items, filter, fields) {
    const pattern = filter
        .replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")
        .replace(/[\s\uFEFF\xA0]+/g, "\\s+");
    const regexp = new RegExp(pattern, "i");
    const formatted = [];
    for (const { key, formatter, filterByFormatted: by } of fields) {
        const format = typeof by === "function" ? by : by && formatter;
        if (typeof format === "function") {
            formatted.push([key, format]);
        }
    }
    return items.filter((item) => {
        if (!isObject(item)) {
            return regexp.test("");
        }
        const row = { ...item };
        for (const [key, format] of formatted) {
            row[key] = format(item[key], key, item);
        }
        OWN_KEYS.forEach((key) => delete row[key]);
        return regexp.test(flatten(row));
    });
}

// Digits count as a number also in a string; a string with a sign or an exponent does not.
function sortValue(value) {
    return /^[0-9]*\.?[0-9]+$/.test(String(value)) ? parseFloat(value) : value;
}

const isNumber = (value) => typeof value === "number";
const isDate = (value) => value instanceof Date;

// the order of String.prototype.localeCompare with these options
const collator = new Intl.Collator(undefined, { numeric: true, usage: "sort" });

export function sortItems(items, key, descending, nullLast) {
    // each value is read once, not at every comparison
    const rows = items.map((item, index) => ({
        item,
        index,
        value: sortValue(get(item, key, "")),
    }));
    const textOf = (row) => row.text ?? (row.text = flatten(row.value));
    const compare = (a, b) => {
        const [x, y] = [a.value, b.value];
        if ((isDate(x) && isDate(y)) || (isNumber(x) && isNumber(y))) {
            return x < y ? -1 : x > y ? 1 : 0;
        }
        if (nullLast && (x === "") !== (y === "")) {
            return x === "" ? 1 : -1;
        }
        return collator.compare(textOf(a), textOf(b));
    };
    const direction = descending ? -1 : 1;
    return rows
        .sort((a, b) => direction * compare(a, b) || a.index - b.index)
        .map((row) => row.item);
}

export function looseEqual(a, b) {
    if (a === b) {
        return true;
    }
    if (isDate(a) || isDate(b)) {
        return isDate(a) && isDate(b) && a.getTime() === b.getTime();
    }
    if (Array.isArray(a) !== Array.isArray(b) || isObject(a) !== isObject(b)) {
        return false;
    }
    if (Array.isArray(a)) {
        return a.length === b.length && a.every((x, i) => looseEqual(x, b[i]));
    }
    if (isObject(a)) {
        const keys = Object.keys(a);
        return (
            keys.length === Object.keys(b).length &&
            keys.every(
                (key) =>
                    Object.prototype.hasOwnProperty.call(b, key) &&
                    looseEqual(a[key], b[key])
            )
        );
    }
    return String(a) === String(b);
}

const CONTROLS = [
    "a",
    "a *",
    "button",
    "button *",
    "input:not(.disabled):not([disabled])",
    "select:not(.disabled):not([disabled])",
    "textarea:not(.disabled):not([disabled])",
    '[role="link"]',
    '[role="link"] *',
    '[role="button"]',
    '[role="button"] *',
    "[tabindex]:not(.disabled):not([disabled])",
].join(",");

// A click on a control in a cell is for the control.
function isForControl({ target }) {
    if (target.disabled || ["TD", "TH", "TR"].includes(target.tagName)) {
        return false;
    }
    const around = (selector) => {
        const el = target.closest(selector);
        return el !== target && el;
    };
    if (around(".dropdown-menu")) {
        return true;
    }
    const label = target.tagName === "LABEL" ? target : around("label");
    if (label) {
        const id = label.getAttribute("for");
        const input = id
            ? document.getElementById(id)
            : label.querySelector("input, select, textarea");
        if (input && !input.disabled) {
            return true;
        }
    }
    return target.matches(CONTROLS);
}

// the mouse went up at the end of a selection
function isSelecting(el) {
    const selection = window.getSelection();
    return (
        selection.toString().trim() !== "" && selection.containsNode(el, true)
    );
}

export function countsAsClick(event, el) {
    return !isForControl(event) && !isSelecting(el);
}
