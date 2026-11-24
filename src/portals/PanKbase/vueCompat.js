// What `vue` resolves to in PanKbase's build: our components run without compat (MODE 3), BootstrapVue's with it (MODE 2,
// vueCompat.js in utils). The features below stay on for both, because BootstrapVue uses them outside its components.
import Vue from "../../utils/vueCompat";

Vue.configureCompat({
    MODE: 3,
    // its plugin, the apps it makes for tooltips and toasts, and portal-vue
    GLOBAL_EXTEND: true,
    GLOBAL_MOUNT: true,
    GLOBAL_PROTOTYPE: true,
    GLOBAL_SET: true,
    // read on the component whose template has the b-* tag or the v-b-* directive
    COMPONENT_FUNCTIONAL: true,
    CUSTOM_DIR: true,
    // it listens on the page's root (dropdowns, modals, tables) and on the component that has a tooltip or toast
    INSTANCE_EVENT_EMITTER: true,
    // $bvToast takes $createElement from the component that calls it
    PRIVATE_APIS: true,
});

export * from "../../utils/vueCompat";
export default Vue;
