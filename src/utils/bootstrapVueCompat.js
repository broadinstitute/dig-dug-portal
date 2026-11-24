// What `bootstrap-vue` resolves to in the default build (alias in vue.config.js): BootstrapVue, installed on the global Vue
// of @vue/compat and not on the page's app, because the apps that are not mountPage's have only what the global Vue has:
// those that BootstrapVue makes itself (tooltips, popovers, toasts) and the search box of ResearchPageHeader. They do not
// get the page's store or the plugins passed to mountPage.
import Vue from "vue";
import {
    BootstrapVue as components,
    BootstrapVueIcons as icons,
} from "bootstrap-vue/esm/index.js";

Vue.use(components);
Vue.use(icons);

// for mountPage's `app.use`: nothing left to install
export const BootstrapVue = { install() {} };
export const BootstrapVueIcons = { install() {} };
export * from "bootstrap-vue/esm/index.js";
