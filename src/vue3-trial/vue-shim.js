// TRIAL ONLY. What `import Vue from "vue"` resolves to in the trial build.
import Vue from "@vue/compat/dist/vue.runtime.esm-bundler.js";

// Compat's WATCH_ARRAY deep-traverses every watched array, so a watcher that edits the rows it watches loops forever.
Vue.configureCompat({ WATCH_ARRAY: false });
// BootstrapVue does rely on it (b-table and items.push), and its components are the ones built with Vue.extend.
const extend = Vue.extend;
Vue.extend = function (options) {
    if (options && typeof options === "object" && !options.compatConfig) options.compatConfig = { WATCH_ARRAY: true };
    return extend.call(this, options);
};

// BootstrapVue 2.23 gives its inputs a `model` directive with no handler and patches el._assign; since Vue 3.4 the
// assigner lives under a symbol, so changing such an input throws "el[assignKey] is not a function".
const dir = Vue.vModelDynamic;
for (const hook of ["created", "beforeUpdate"]) {
    const original = dir[hook];
    dir[hook] = function (el, binding, vnode, prev) {
        original.call(this, el, binding, vnode, prev);
        for (const key of Object.getOwnPropertySymbols(el)) {
            if (key.description === "_assign" && typeof el[key] !== "function") el[key] = () => {};
        }
    };
}

// Vue 2's $mount("#app") replaces #app; Vue 3 renders inside it. Keep the extra element out of the layout.
const style = document.createElement("style");
style.textContent = "#app{display:contents}";
document.head.appendChild(style);

export * from "@vue/compat/dist/vue.runtime.esm-bundler.js";
export default Vue;
