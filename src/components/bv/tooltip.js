// The directive v-b-tooltip.
import { nextTick, warn } from "vue";
import { isVisible } from "./dom";
import { fade, stopFade } from "./fade";
import { place } from "./placement";

const SIDES = ["top", "bottom", "left", "right"];
const TRIGGERS = {
    mouseenter: "hover",
    mouseleave: "hover",
    focusin: "focus",
    focusout: "focus",
};
// before it shows and before it hides
const DELAY = 50;
const HIDDEN_TITLE = "data-original-title";

const noop = () => {};
let lastId = 0;

const names = (classes) => classes.split(/\s+/).filter(Boolean);

function isDisabled(el) {
    return el.hasAttribute("disabled") || el.classList.contains("disabled");
}

class Tooltip {
    constructor(el, scopeId, options) {
        Object.assign(this, { el, scopeId }, options);
        this.id = `__bv_tooltip_${++lastId}__`;
        this.handle = this.handle.bind(this);
        // the element of the tooltip, while there is one
        this.tip = null;
        this.hiding = false;
        this.active = { hover: false, focus: false };
        // "in" or "out": what it waits for
        this.state = "";
        this.listen(el, true);
    }

    listen(el, on, types = Object.keys(TRIGGERS)) {
        const method = on ? "addEventListener" : "removeEventListener";
        types
            .filter((type) => this.triggers.includes(TRIGGERS[type]))
            .forEach((type) => el[method](type, this.handle));
    }

    update({ title, customClass }) {
        const { tip } = this;
        if (customClass !== this.customClass) {
            tip?.classList.remove(...names(this.customClass));
            tip?.classList.add(...names(customClass));
            this.customClass = customClass;
        }
        if (title === undefined || title === this.title) {
            return;
        }
        this.title = title;
        if (tip) {
            this.hideTitle();
            this.render();
            this.placed.update();
        }
        if (!title) {
            this.hide();
        }
    }

    // Of the element and of the tooltip itself: from the one to the other it enters before the delay of leaving is over.
    handle({ type }) {
        if (isDisabled(this.el)) {
            return;
        }
        if (type === "mouseenter" || type === "focusin") {
            this.enter(TRIGGERS[type]);
        } else {
            this.leave(TRIGGERS[type]);
        }
    }

    enter(trigger) {
        this.active[trigger] = true;
        const waits = this.state === "in";
        this.state = "in";
        if (this.tip || waits) {
            return;
        }
        this.hideTitle();
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            if (this.state === "in") {
                this.show();
            } else {
                this.restoreTitle();
            }
        }, DELAY);
    }

    leave(trigger) {
        if (trigger) {
            this.active[trigger] = false;
        }
        if (this.active.hover || this.active.focus) {
            return;
        }
        this.state = "out";
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            if (this.state === "out") {
                this.hide();
            }
        }, DELAY);
    }

    show() {
        const { container, el, side } = this;
        const isEmpty = this.title === undefined || this.title === null;
        if (this.tip || isEmpty || this.title === "" || !isVisible(el)) {
            return;
        }
        this.hideTitle();
        this.describe(true);

        const tip = document.createElement("div");
        tip.id = this.id;
        tip.tabIndex = -1;
        tip.setAttribute("role", "tooltip");
        tip.className = `tooltip b-tooltip bs-tooltip-${side}`;
        tip.classList.add(...names(this.customClass));
        if (this.scopeId) {
            tip.setAttribute(this.scopeId, "");
        }
        const arrow = document.createElement("div");
        arrow.className = "arrow";
        const inner = document.createElement("div");
        inner.className = "tooltip-inner";
        tip.append(arrow, inner);
        Object.assign(this, { tip, inner, shownSide: side });
        this.render();

        // first, so that it is never seen without
        fade(tip, true, () => {
            const left = this.state === "out";
            this.state = "";
            if (left) {
                this.leave();
            }
        });
        const around = container
            ? document.getElementById(container)
            : el.closest(".modal-content");
        (around || document.body).append(tip);
        this.placed = place(el, tip, {
            placement: side,
            boundary: this.boundary,
            arrow,
            onPlaced: (placed) => this.turn(placed),
        });
        this.listenWhileOpen(true);
    }

    render() {
        if (this.html) {
            this.inner.innerHTML = this.title;
        } else {
            this.inner.textContent = this.title;
        }
    }

    // the placement may have flipped it; its shape changes with the side
    turn(side) {
        if (side !== this.shownSide) {
            this.tip.classList.replace(
                `bs-tooltip-${this.shownSide}`,
                `bs-tooltip-${side}`
            );
            this.shownSide = side;
            this.placed.update();
        }
    }

    hide() {
        if (!this.tip) {
            this.restoreTitle();
            return;
        }
        this.active = { hover: false, focus: false };
        this.state = "";
        if (!this.hiding) {
            this.hiding = true;
            this.listenWhileOpen(false);
            fade(this.tip, false, () => this.remove());
        }
    }

    listenWhileOpen(on) {
        // hovering it keeps it open
        this.listen(this.tip, on);
        clearInterval(this.interval);
        if (on) {
            // the element may be in a tab that hides, or go without telling
            this.interval = setInterval(() => {
                if (!isVisible(this.el)) {
                    this.hide();
                }
            }, 100);
        }
        // iOS tells of a tap outside only where there is a listener
        if ("ontouchstart" in document.documentElement) {
            const method = on ? "addEventListener" : "removeEventListener";
            [...document.body.children].forEach((child) =>
                child[method]("mouseover", noop)
            );
        }
    }

    // at once
    remove() {
        clearTimeout(this.timer);
        this.active = { hover: false, focus: false };
        this.state = "";
        if (this.tip) {
            this.listenWhileOpen(false);
            stopFade(this.tip);
            this.placed.destroy();
            this.tip.remove();
            this.tip = null;
            this.hiding = false;
            this.describe(false);
        }
        this.restoreTitle();
    }

    destroy() {
        this.listen(this.el, false);
        this.remove();
    }

    describe(on) {
        const ids = (this.el.getAttribute("aria-describedby") || "")
            .split(/\s+/)
            .filter((id) => id && id !== this.id);
        if (on) {
            ids.push(this.id);
        }
        if (ids.length) {
            this.el.setAttribute("aria-describedby", ids.join(" "));
        } else {
            this.el.removeAttribute("aria-describedby");
        }
    }

    // The browser would show it too.
    hideTitle() {
        const title = this.el.getAttribute("title");
        if (title !== null) {
            this.el.setAttribute("title", "");
        }
        if (title) {
            this.el.setAttribute(HIDDEN_TITLE, title);
        }
    }

    restoreTitle() {
        const title = this.el.getAttribute(HIDDEN_TITLE);
        this.el.removeAttribute(HIDDEN_TITLE);
        if (title) {
            this.el.setAttribute("title", title);
        }
    }
}

const isObject = (value) => value !== null && typeof value === "object";

// Development only
function checkBinding({ modifiers, value }) {
    const known = [...SIDES, "hover", "html", "window"];
    const unknown = Object.keys(modifiers)
        .filter((name) => !known.includes(name))
        .map((name) => `modifier "${name}"`);
    if (isObject(value)) {
        Object.keys(value)
            .filter((name) => !["title", "customClass"].includes(name))
            .forEach((name) => unknown.push(`option "${name}"`));
    } else if (!["string", "number", "undefined"].includes(typeof value)) {
        unknown.push(`value ${value}`);
    }
    unknown.forEach((what) =>
        warn(`[bv] v-b-tooltip does not support the ${what}`)
    );
}

function read({ arg, modifiers, value }, vnode) {
    const options = isObject(value) ? value : { title: value ?? undefined };
    const { customClass = "", title = vnode.props?.title ?? undefined } =
        options;
    return {
        title,
        customClass,
        side: SIDES.find((side) => modifiers[side]) || "top",
        boundary: modifiers.window ? "window" : "scrollParent",
        html: !!modifiers.html,
        triggers: modifiers.hover ? ["hover"] : ["hover", "focus"],
        // the argument is the id of the element to be put into, also in v-b-tooltip:hover: so that one shows on focus, too
        container: arg,
    };
}

const tooltips = new WeakMap();

export default {
    mounted(el, binding, vnode) {
        if (process.env.NODE_ENV !== "production") {
            checkBinding(binding);
        }
        const scopeId = binding.instance?.$options.__scopeId;
        tooltips.set(el, new Tooltip(el, scopeId, read(binding, vnode)));
    },
    updated(el, binding, vnode) {
        nextTick(() => tooltips.get(el)?.update(read(binding, vnode)));
    },
    beforeUnmount(el) {
        tooltips.get(el).destroy();
        tooltips.delete(el);
    },
};
