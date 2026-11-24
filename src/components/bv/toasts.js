// $bvToast
import { h, nextTick, render, shallowReactive, warn } from "vue";
import BToaster from "./BToaster.vue";
import { nextId } from "./helpers";

const OPTIONS = [
    "appendToast",
    "autoHideDelay",
    "id",
    "noAutoHide",
    "noCloseButton",
    "solid",
    "title",
    "toaster",
    "variant",
];

const toasters = new Map();
let lastKey = 0;

// Made for its first toast, and stays.
function toasterOf(name, app) {
    if (!toasters.has(name)) {
        const el = document.createElement("div");
        el.id = name;
        el.className = `b-toaster ${name}`;
        document.body.append(el);
        const toasts = shallowReactive([]);
        const gone = (toast) => toasts.splice(toasts.indexOf(toast), 1);
        const vnode = h(BToaster, { toasts, onGone: gone });
        // for what a message may be made of
        vnode.appContext = app._context;
        render(vnode, el);
        toasters.set(name, { el, toasts, toaster: vnode.component.proxy });
    }
    return toasters.get(name);
}

export function bvToast(app) {
    app.onUnmount?.(() => {
        toasters.forEach(({ el }) => {
            render(null, el);
            el.remove();
        });
        toasters.clear();
    });
    return {
        // `content`: text, a vnode or a list of them
        toast(content, options = {}) {
            if (process.env.NODE_ENV !== "production") {
                Object.keys(options)
                    .filter((name) => !OPTIONS.includes(name))
                    .forEach((name) =>
                        warn(
                            `[bv] $bvToast does not support the option "${name}"`
                        )
                    );
            }
            if (!content) {
                return;
            }
            const toast = shallowReactive({
                autoHideDelay: 5000,
                ...options,
                content: [].concat(content),
                id: options.id || nextId(),
                key: ++lastKey,
                shown: false,
                hiding: false,
            });
            requestAnimationFrame(() => {
                const name = options.toaster || "b-toaster-top-right";
                const { toasts } = toasterOf(name, app);
                toasts[options.appendToast ? "push" : "unshift"](toast);
                // first the place, then what is in it: for screen readers
                nextTick(() =>
                    requestAnimationFrame(() => {
                        toast.shown = true;
                    })
                );
            });
        },
        // all of them without an id
        hide(id) {
            toasters.forEach(({ toasts, toaster }) =>
                toasts
                    .filter((toast) => !id || toast.id === id)
                    .forEach(toaster.hide)
            );
        },
    };
}
