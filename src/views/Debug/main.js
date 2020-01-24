import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";


Vue.config.productionTip = false;

new Vue({
    store,

    components: {

    },
    data: {

    },

    created() {
        let chrom = this.$store.state.chrom;
        let start = this.$store.state.start;
        let end = this.$store.state.end;
        let phenotype = this.$store.state.phenotype;
        let limit = 50;

        this.$store.dispatch("graphPrioritizationVariant/object", {
            chrom,
            start,
            end,
            phenotype,
            limit
        });
    },

    render(createElement, context) {
        return createElement(Template);
    },

    computed: {
        prioritizationVariants() {
            return this.$store.getters["graphPrioritizationVariant/prioritizationVariants"];
        },
    },


    watch: {

    }
}).$mount("#app");
