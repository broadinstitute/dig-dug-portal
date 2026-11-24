import { warn } from "vue";

// A functional component, as BootstrapVue's is: Vue leaves these out of `$parent`, which FilterControlTemplate.vue counts
// on (`this.$parent.$parent`). @vue/compat takes a function for an async component unless it is marked as one of its own;
// plain Vue ignores the mark.
export function functional(render, options) {
    return Object.assign(render, { __isBuiltIn: true }, options);
}

let lastId = 0;
export function nextId() {
    return `__BVID__${++lastId}`;
}

// Loosely, as BootstrapVue compares values: 2 and "2" are the same.
export function same(a, b) {
    return a === b || String(a) === String(b);
}

const PLAIN =
    /^(class|style|id|title|role|tabindex|lang|dir|hidden|(aria|data)-.+)$/;
const NATIVE_LISTENER = /^on[A-Z][a-z]+(Once|Passive|Capture)*$/;
const reported = new Set();

// Development only: warns once about each attribute, listener and slot that a component does not support, so that nothing
// of BootstrapVue is left out silently. `listeners`: native ones reach the element. `attributes`: more plain ones that the
// element takes. `not`: exceptions to what is let through. `slots`: names, or patterns of names.
export function checkUse(
    tag,
    { attrs, slots },
    {
        attributes = [],
        not = [],
        listeners = false,
        slots: known = ["default"],
    } = {}
) {
    const report = (kind, name) => {
        const message = `[bv] <${tag}> does not support the ${kind} "${name}"`;
        if (!reported.has(message)) {
            reported.add(message);
            warn(message);
        }
    };
    for (const name of Object.keys(attrs)) {
        if (/^on[^a-z]/.test(name)) {
            if (
                !listeners ||
                !NATIVE_LISTENER.test(name) ||
                not.includes(name)
            ) {
                report("listener", name[2].toLowerCase() + name.slice(3));
            }
        } else if (
            not.includes(name) ||
            !(PLAIN.test(name) || attributes.includes(name))
        ) {
            report("attribute", name);
        }
    }
    for (const name of Object.keys(slots)) {
        if (
            !known.some((k) =>
                typeof k === "string" ? k === name : k.test(name)
            )
        ) {
            report("slot", name);
        }
    }
}

// The same for a component with an instance, as a mixin.
export function checksUse(tag, supported) {
    const check = function () {
        checkUse(tag, { attrs: this.$attrs, slots: this.$slots }, supported);
    };
    return { created: check, beforeUpdate: check };
}
