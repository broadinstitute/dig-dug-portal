export function toInteger(value, otherwise = NaN) {
    const number = parseInt(value, 10);
    return isNaN(number) ? otherwise : number;
}

export function stopEvent(event) {
    event.preventDefault();
    event.stopPropagation();
}

export function isVisible(el) {
    if (!el || !document.body.contains(el) || el.style.display === "none") {
        return false;
    }
    const { width, height } = el.getBoundingClientRect();
    return width > 0 && height > 0;
}

// Returns whether the element has the focus.
export function focusOn(el, options) {
    if (!el) {
        return false;
    }
    el.focus(options);
    return document.activeElement === el;
}
