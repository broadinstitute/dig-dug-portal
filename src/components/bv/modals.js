// The modals of the page: $bvModal, and what those that are open do to the body.
import { nextTick } from "vue";

const FIXED = ".fixed-top, .fixed-bottom, .is-fixed, .sticky-top";

// the mounted ones
export const modals = new Set();

export const bvModal = {
    show(id) {
        modals.forEach((modal) => modal.modalId === id && modal.show());
    },
    hide(id) {
        modals.forEach((modal) => modal.modalId === id && modal.hide());
    },
};

// Measures an element that has the class.
function measure(className, read) {
    const el = document.createElement("div");
    el.className = className;
    document.body.append(el);
    const value = read(el);
    el.remove();
    return value;
}

let zIndex = null;
export function baseZIndex() {
    zIndex =
        zIndex ??
        (measure("modal-backdrop d-none", (el) =>
            parseInt(getComputedStyle(el).zIndex, 10)
        ) ||
            1040);
    return zIndex;
}

let scrollbar = null;
function scrollbarWidth() {
    scrollbar =
        scrollbar ??
        measure(
            "modal-scrollbar-measure",
            (el) => el.getBoundingClientRect().width - el.clientWidth
        );
    return scrollbar;
}

// Room for the scrollbar that goes: [element, style property, its value before]
let padded = [];

function pad(el, property, width) {
    const before = el.style[property];
    const attribute = `data-${
        property === "paddingRight" ? "padding" : "margin"
    }-right`;
    el.setAttribute(attribute, before);
    const now = parseFloat(getComputedStyle(el)[property]) || 0;
    el.style[property] = `${now + width}px`;
    padded.push([el, property, before, attribute]);
}

function bodyOverflows() {
    const { left, right } = document.body.getBoundingClientRect();
    return left + right < window.innerWidth;
}

// the open ones, the last one on top
const open = [];
let count = 0;

function update() {
    const { body } = document;
    const before = count;
    count = open.length;
    if (count && !before) {
        const width = scrollbarWidth();
        if (bodyOverflows()) {
            const all = (selector) => document.querySelectorAll(selector);
            all(FIXED).forEach((el) => pad(el, "paddingRight", width));
            all(".sticky-top").forEach((el) => pad(el, "marginRight", -width));
            all(".navbar-toggler").forEach((el) =>
                pad(el, "marginRight", width)
            );
            pad(body, "paddingRight", width);
        }
        body.classList.add("modal-open");
    } else if (!count && before) {
        padded.forEach(([el, property, value, attribute]) => {
            el.style[property] = value;
            el.removeAttribute(attribute);
        });
        padded = [];
        body.classList.remove("modal-open");
    }
    if (count !== before) {
        body.setAttribute("data-modal-open-count", count);
    }
    const overflows = bodyOverflows();
    requestAnimationFrame(() => {
        open.forEach((modal, index) => {
            modal.place({
                zIndex: baseZIndex() + index,
                scrollbarWidth: scrollbarWidth(),
                isTop: index === open.length - 1,
                bodyOverflows: overflows,
            });
        });
    });
}

export function opened(modal) {
    if (!open.includes(modal)) {
        open.push(modal);
        nextTick(update);
    }
}

export function closed(modal) {
    const index = open.indexOf(modal);
    if (index >= 0) {
        open.splice(index, 1);
        nextTick(update);
    }
}
