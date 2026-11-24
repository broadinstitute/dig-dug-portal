// TRIAL ONLY. Vuex 4 under @vue/compat while the pages still do Vue.use(Vuex) + new Vue({ store }).
// Vuex 4's default export has no install(), so this adds one that injects $store the way Vuex 3 did.
import * as vuex from "vuex/dist/vuex.esm-bundler.js";

function install(Vue) {
    if (install.done) return;
    install.done = true;
    Vue.mixin({
        beforeCreate() {
            const options = this.$options;
            if (options.store) {
                this.$store = typeof options.store === "function" ? options.store() : options.store;
            } else {
                const parent = options.parent || this.$parent;
                if (parent && parent.$store) this.$store = parent.$store;
            }
        },
    });
}

export * from "vuex/dist/vuex.esm-bundler.js";
export default { ...vuex.default, install };
