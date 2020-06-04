import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';



import LocusZoom from "@/components/lz/LocusZoom";
import LocusZoomAssociationsPanel from "@/components/lz/panels/LocusZoomAssociationsPanel";
import LocusZoomPhewasPanel from "@/components/lz/panels/LocusZoomPhewasForestPanel";
import LocusZoomChild from "@/components/lz/panels/LocusZoomChild";

Vue.config.productionTip = false;
new Vue({
    store,

    components: {
        LocusZoom,
        LocusZoomAssociationsPanel,
        LocusZoomPhewasPanel,
    },

    data() {
        return {
            phenotypes: ['T2D', 'BMI'],
            addPhenotype: '',
            removePhenotype: '',
        }
    },

    render(createElement, context) {
        return createElement(Template);
    },

    methods: {
        addAPhenotype() {
            console.log(this.addPhenotype);
            this.phenotypes.push(this.addPhenotype);
        },
        removeAPhenotype() {
            console.log(this.removePhenotype);
            this.phenotypes = this.phenotypes.filter(p => p !== this.removePhenotype);
        }
     },

    computed: {

    },

}).$mount("#app");
