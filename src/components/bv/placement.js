// Where Popper 1 puts a menu or a tooltip for BootstrapVue (after popper.js 1.16.1, MIT, see LICENSE.txt): its modifiers
// shift, preventOverflow, keepTogether, arrow, flip, hide and computeStyle, with the settings that BootstrapVue's dropdown
// and tooltip give them. Not here: "auto", offsets, other fallbacks than the opposite side, position: fixed.

const PADDING = 5;
const OPPOSITE = { top: "bottom", bottom: "top", left: "right", right: "left" };
const html = document.documentElement;

const px = (value) => parseFloat(value) || 0;

function withEdges(rect) {
    return {
        ...rect,
        right: rect.left + rect.width,
        bottom: rect.top + rect.height,
    };
}

function scrollParent(el) {
    while (el && ![document, html, document.body].includes(el)) {
        const { overflow, overflowX, overflowY } = getComputedStyle(el);
        if (/auto|scroll|overlay/.test(overflow + overflowX + overflowY)) {
            return el;
        }
        el = el.parentNode;
    }
    return document.body;
}

function offsetParent(el) {
    let parent = el?.offsetParent;
    while (el && !parent && el.nextElementSibling) {
        el = el.nextElementSibling;
        parent = el.offsetParent;
    }
    if (!parent || parent === document.body) {
        return html;
    }
    const isCell = ["TD", "TH", "TABLE"].includes(parent.nodeName);
    return isCell && getComputedStyle(parent).position === "static"
        ? offsetParent(parent)
        : parent;
}

function commonOffsetParent(a, b) {
    const range = document.createRange();
    const follows =
        a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING;
    range.setStart(follows ? a : b, 0);
    range.setEnd(follows ? b : a, 0);
    const common = range.commonAncestorContainer;
    const isOne =
        common !== document.body &&
        (common === html || offsetParent(common.firstElementChild) === common);
    return isOne ? common : offsetParent(common);
}

function documentSize() {
    const size = (axis) =>
        Math.max(
            document.body[`offset${axis}`],
            document.body[`scroll${axis}`],
            html[`client${axis}`],
            html[`offset${axis}`],
            html[`scroll${axis}`]
        );
    return { width: size("Width"), height: size("Height") };
}

// The box in the window, without scrollbars. Popper compares rounded sizes with exact ones here, and so do we: half a pixel
// may decide how a tooltip is rounded.
function box(el) {
    const { left, top, right, bottom } = el.getBoundingClientRect();
    const rect = { left, top, width: right - left, height: bottom - top };
    const size = el === html ? documentSize() : {};
    const width = size.width || el.clientWidth || rect.width;
    const height = size.height || el.clientHeight || rect.height;
    const [barX, barY] = [el.offsetWidth - width, el.offsetHeight - height];
    if (barX || barY) {
        const style = getComputedStyle(el);
        rect.width -=
            barX - px(style.borderLeftWidth) - px(style.borderRightWidth);
        rect.height -=
            barY - px(style.borderTopWidth) - px(style.borderBottomWidth);
    }
    return rect;
}

function relativeBox(el, parent) {
    const [inner, outer] = [box(el), box(parent)];
    const style = getComputedStyle(parent);
    const rect = {
        left: inner.left - outer.left - px(style.borderLeftWidth),
        top: inner.top - outer.top - px(style.borderTopWidth),
        width: inner.width,
        height: inner.height,
        marginLeft: 0,
        marginTop: 0,
    };
    if (parent === html) {
        rect.marginLeft = px(style.marginLeft);
        rect.marginTop = px(style.marginTop);
        rect.left += rect.marginLeft - px(style.borderLeftWidth);
        rect.top += rect.marginTop - px(style.borderTopWidth);
    } else if (parent === scrollParent(el)) {
        rect.left += parent.scrollLeft;
        rect.top += parent.scrollTop;
    }
    return withEdges(rect);
}

function isFixed(el) {
    if (!el || el === html || el === document.body) {
        return false;
    }
    return (
        getComputedStyle(el).position === "fixed" || isFixed(el.parentElement)
    );
}

function padded({ left, top, right, bottom }) {
    return {
        left: left + PADDING,
        top: top + PADDING,
        right: right - PADDING,
        bottom: bottom - PADDING,
    };
}

function windowBox(parent) {
    const rect = relativeBox(parent, html);
    const { scrollLeft, scrollTop } = document.scrollingElement || html;
    return padded(
        withEdges({
            left: scrollLeft - rect.left + rect.marginLeft,
            top: scrollTop - rect.top + rect.marginTop,
            width: Math.max(html.clientWidth, window.innerWidth),
            height: Math.max(html.clientHeight, window.innerHeight),
        })
    );
}

// "scrollParent": what the reference scrolls in, "window": the whole document
function boundaryBox(boundary, reference, parent) {
    let el = html;
    if (boundary === "scrollParent") {
        el = scrollParent(reference.parentNode);
        el = el === document.body ? html : el;
    }
    const rect = relativeBox(el, parent);
    if (el !== html || isFixed(parent)) {
        return padded(rect);
    }
    const { width, height } = documentSize();
    return padded({
        left: rect.left - rect.marginLeft,
        top: rect.top - rect.marginTop,
        right: rect.left + width,
        bottom: rect.top + height,
    });
}

function outerSize(el) {
    const style = getComputedStyle(el);
    const [x, y] = [
        px(style.marginLeft) + px(style.marginRight),
        px(style.marginTop) + px(style.marginBottom),
    ];
    return { width: el.offsetWidth + x, height: el.offsetHeight + y };
}

// At one side of the reference
function attempt(side, variation, { popper, arrow, ref, bounds }) {
    const beside = side === "left" || side === "right";
    const [start, end, length] = beside
        ? ["top", "bottom", "height"]
        : ["left", "right", "width"];
    const rect = outerSize(popper);
    if (variation === "start") {
        rect[start] = ref[start];
    } else if (variation === "end") {
        rect[start] = ref[start] + ref[length] - rect[length];
    } else {
        rect[start] = ref[start] + ref[length] / 2 - rect[length] / 2;
    }
    const across = beside ? "left" : "top";
    rect[across] =
        side === across
            ? ref[side] - rect[beside ? "width" : "height"]
            : ref[side];

    // inside of the boundary
    let { right, bottom } = withEdges(rect);
    rect.left = Math.max(rect.left, bounds.left);
    if (right > bounds.right) {
        rect.left = Math.min(rect.left, bounds.right - rect.width);
    }
    rect.top = Math.max(rect.top, bounds.top);
    if (bottom > bounds.bottom) {
        rect.top = Math.min(rect.top, bounds.bottom - rect.height);
    }

    // not away from the reference
    const far = withEdges(rect)[end];
    if (far < Math.floor(ref[start])) {
        rect[start] = Math.floor(ref[start]) - rect[length];
    }
    if (rect[start] > Math.floor(ref[end])) {
        rect[start] = Math.floor(ref[end]);
    }
    if (!arrow) {
        return { rect: withEdges(rect) };
    }

    // the arrow at the middle of the reference, with room for it
    const size = outerSize(arrow)[length];
    const edge = withEdges(rect)[end];
    rect[start] = Math.min(rect[start], ref[end] - size);
    if (ref[start] + size > edge) {
        rect[start] += ref[start] + size - edge;
    }
    const style = getComputedStyle(popper);
    const name = beside ? "Top" : "Left";
    const middle =
        ref[start] +
        ref[length] / 2 -
        size / 2 -
        rect[start] -
        px(style[`margin${name}`]) -
        px(style[`border${name}Width`]);
    const at = Math.round(Math.max(Math.min(rect[length] - size, middle), 0));
    return {
        rect: withEdges(rect),
        arrowStyle: { [start]: `${at}px`, [across]: "" },
    };
}

function overflows(side, rect, ref, room) {
    const { floor } = Math;
    if (side === "top" || side === "left") {
        return (
            floor(rect[OPPOSITE[side]]) > floor(ref[side]) ||
            floor(rect[side]) < floor(room[side])
        );
    }
    return (
        floor(rect[OPPOSITE[side]]) < floor(ref[side]) ||
        floor(rect[side]) > floor(room[side])
    );
}

// whole pixels, except where Popper finds that Firefox does better without
function rounded(rect, ref, placement) {
    if (window.devicePixelRatio >= 2 && /firefox/i.test(navigator.userAgent)) {
        return rect;
    }
    const [own, other] = [Math.round(rect.width), Math.round(ref.width)];
    const centered = placement === "top" || placement === "bottom";
    const odd = own % 2 === 1 && other % 2 === 1;
    const left = odd && !placement.includes("-") ? rect.left - 1 : rect.left;
    return {
        left:
            centered && own % 2 !== other % 2
                ? Math.floor(left)
                : Math.round(left),
        top: Math.round(rect.top),
    };
}

// Keeps `popper` at `reference` until destroy() is called. `placement`: a side, or a side and "-start" or "-end".
export function place(
    reference,
    popper,
    { placement, boundary = "scrollParent", arrow = null, onPlaced }
) {
    const [wanted, variation] = placement.split("-");
    const { style } = popper;
    let destroyed = false;

    function update() {
        if (destroyed) {
            return;
        }
        const parent = commonOffsetParent(popper, reference);
        const ref = relativeBox(reference, parent);
        // the document's size is the one without the popper
        const { top, left, transform } = style;
        Object.assign(style, { top: "", left: "", transform: "" });
        const bounds = boundaryBox(boundary, reference, parent);
        Object.assign(style, { top, left, transform });

        const parts = { popper, arrow, ref, bounds };
        let side = wanted;
        let { rect, arrowStyle } = attempt(side, variation, parts);
        if (overflows(side, rect, ref, windowBox(parent))) {
            side = OPPOSITE[side];
            ({ rect, arrowStyle } = attempt(side, variation, parts));
        }

        const placed = variation ? `${side}-${variation}` : side;
        const at = rounded(rect, ref, placed);
        Object.assign(style, {
            position: "absolute",
            transform: `translate3d(${at.left}px, ${at.top}px, 0px)`,
            top: "0px",
            left: "0px",
            willChange: "transform",
        });
        popper.setAttribute("x-placement", placed);
        popper.toggleAttribute(
            "x-out-of-boundaries",
            ref.bottom < bounds.top ||
                ref.left > bounds.right ||
                ref.top > bounds.bottom ||
                ref.right < bounds.left
        );
        if (arrow) {
            Object.assign(arrow.style, arrowStyle);
        }
        onPlaced?.(side);
    }
    const schedule = () => requestAnimationFrame(update);

    const scrollers = [];
    for (let el = scrollParent(reference); el; ) {
        scrollers.push(el === document.body ? window : el);
        el = el === document.body ? null : scrollParent(el.parentNode);
    }
    scrollers.forEach((el) =>
        el.addEventListener("scroll", schedule, { passive: true })
    );
    window.addEventListener("resize", schedule, { passive: true });

    style.position = "absolute";
    popper.setAttribute("x-placement", placement);
    // when the popper is rendered and displayed
    Promise.resolve().then(update);

    return {
        update: schedule,
        destroy() {
            destroyed = true;
            scrollers.forEach((el) =>
                el.removeEventListener("scroll", schedule)
            );
            window.removeEventListener("resize", schedule);
            popper.removeAttribute("x-placement");
            const none = { position: "", top: "", left: "", transform: "" };
            Object.assign(style, none, { willChange: "" });
        },
    };
}
