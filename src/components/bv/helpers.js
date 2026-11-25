import { Comment, warn } from "vue";

// A functional component, as BootstrapVue's is: Vue leaves these out of `$parent`, which FilterControlTemplate.vue counts
// on (`this.$parent.$parent`). `supported`: see checkUse; native listeners always reach the element.
export function functional(tag, render, options, supported) {
    const component =
        process.env.NODE_ENV === "production"
            ? render
            : (props, context) => {
                  checkUse(tag, context, { listeners: true, ...supported });
                  return render(props, context);
              };
    return Object.assign(component, {
        displayName: render.name,
        // class, style and listeners in attrs, also under a compat parent
        compatConfig: { MODE: 3 },
        ...options,
    });
}

let lastId = 0;
export function nextId() {
    return `__BVID__${++lastId}`;
}

// Loosely, as BootstrapVue compares values: 2 and "2" are the same.
export function same(a, b) {
    return a === b || String(a) === String(b);
}

// Where an element is around the one that the attributes are for: what BootstrapVue gives to the outer one (class, style and
// listeners), and the rest.
export function splitAttrs(attrs) {
    const [outer, inner] = [{}, {}];
    for (const [name, value] of Object.entries(attrs)) {
        const isOuter = /^(class|style|on[A-Z].*)$/.test(name);
        (isOuter ? outer : inner)[name] = value;
    }
    return [outer, inner];
}

const PLAIN =
    /^(class|style|id|title|role|tabindex|lang|dir|hidden|(aria|data)-.+)$/;
const NATIVE_LISTENER = /^on[A-Z][a-z]+(Once|Passive|Capture)*$/;
const reported = new Set();

function onlyComments(slot) {
    try {
        return slot().every((vnode) => vnode.type === Comment);
    } catch (err) {
        return false;
    }
}

// Development only: warns once about each attribute, listener and slot that a component does not support, so that nothing
// of BootstrapVue is left out silently. `listeners`: native ones reach the element. `attributes`: more plain ones that the
// element takes. `not`: exceptions to what is let through. `slots`: names, or patterns of names.
function checkUse(
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
        const supported = known.some((k) =>
            typeof k === "string" ? k === name : k.test(name)
        );
        if (!supported && !onlyComments(slots[name])) {
            report("slot", name);
        }
    }
}

// The same for a component with an instance, as its mixins.
export function checksUse(tag, supported) {
    if (process.env.NODE_ENV === "production") {
        return [];
    }
    const check = function () {
        checkUse(tag, { attrs: this.$attrs, slots: this.$slots }, supported);
    };
    return [{ created: check, beforeUpdate: check }];
}
