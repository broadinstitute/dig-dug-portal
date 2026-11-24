// What every page installs and how it mounts, in one place instead of in each page's entry, store and components.
import Vue, { createApp, h } from "vue";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import VueCookies from "vue-cookies";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

// Installed on the global Vue of @vue/compat: every app inherits them, also the ones BootstrapVue creates itself
// (tooltips, popovers, toasts), which do not get the page's store or the plugins passed to mountPage.
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

export function mountPage(Template, options = {}, plugins = []) {
    const app = createApp({ ...options, render: () => h(Template, { ref: "page" }) });
    app.use(VueCookies);
    if (options.store) {
        app.use(options.store);
    }
    plugins.forEach((plugin) => app.use(plugin));
    // Vue 3 renders inside its target, so #app stays. Keep it out of the layout, and without its id: Papers/Research
    // has its own #app.
    const root = document.getElementById("app");
    root.id = "page-root";
    root.style.display = "contents";
    return app.mount(root);
}
