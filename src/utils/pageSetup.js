// What every page installs and how it mounts, in one place instead of in each page's entry, store and components.
// A page entry imports this first: its store creates a Vuex.Store, which needs Vuex installed.
import Vue from "vue";
import Vuex from "vuex";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import VueCookies from "vue-cookies";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

Vue.use(Vuex);
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);
Vue.use(VueCookies);
Vue.config.productionTip = false;

export function mountPage(Template, options = {}, plugins = []) {
    plugins.forEach((plugin) => Vue.use(plugin));
    // Vue 3 mounts inside #app and 2.7 replaces it. Mount inside on both, with the wrapper out of the layout and
    // without its id: Papers/Research has its own #app.
    const root = document.getElementById("app");
    root.id = "page-root";
    root.style.display = "contents";
    const target = root.appendChild(document.createElement("div"));
    return new Vue({ ...options, render: (h) => h(Template) }).$mount(target);
}
