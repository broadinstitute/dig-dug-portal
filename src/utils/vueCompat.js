// What `import ... from "vue"` resolves to, here and in node_modules (alias `vue$` in the build configs): Vue 3 with
// its Vue 2 API (@vue/compat), plus what our components and BootstrapVue 2.23 need to run on it.
import Vue from "@vue/compat/dist/vue.runtime.esm-bundler.js";

// Compat's WATCH_ARRAY deep-traverses every watched array, so a watcher that edits the rows it watches loops forever.
Vue.configureCompat({ WATCH_ARRAY: false });

// BootstrapVue does rely on it (b-table and items.push), and on the rest of compat where a build turns that off for our
// components. Its components are built with Vue.extend; ours are not, but for one that watches nothing.
const extend = Vue.extend;
Vue.extend = function (options) {
    if (options && typeof options === "object" && !options.compatConfig) {
        options.compatConfig = { MODE: 2, WATCH_ARRAY: true };
    }
    return extend(options);
};

// BootstrapVue gives its inputs a `model` directive with no handler and patches el._assign. Since Vue 3.4 the assigner
// is under a symbol, so without this, changing such an input throws "el[assignKey] is not a function".
for (const hook of ["created", "beforeUpdate"]) {
    const original = Vue.vModelDynamic[hook];
    Vue.vModelDynamic[hook] = function (el, binding, vnode, prev) {
        original(el, binding, vnode, prev);
        for (const key of Object.getOwnPropertySymbols(el)) {
            if (
                key.description === "_assign" &&
                typeof el[key] !== "function"
            ) {
                el[key] = () => {};
            }
        }
    };
}

export * from "@vue/compat/dist/vue.runtime.esm-bundler.js";
export default Vue;
