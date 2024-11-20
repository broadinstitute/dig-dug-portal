import Vue from "vue";
import Template from "./Template.vue";
import store from "./store";

import NetworkGraph from "@/components/NetworkGraph.vue";
import keyParams from "@/utils/keyParams";
import { pageMixin } from "@/mixins/pageMixin.js";
new Vue({
    store,
    components: {
        NetworkGraph,
    },
    mixins: [pageMixin],
    data() {
        return {
            pigeanPhenotypeMap: {},
        };
    },
    computed: {
        phenotype() {
            return keyParams.phenotype || "";
        },
        genesetSize() {
            return keyParams.genesetSize || "small";
        },
    },
    async created() {
        this.$store.dispatch("bioPortal/getDiseaseSystems");
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        await this.$store.dispatch("getPigeanPhenotypes");
        this.pigeanPhenotypeMap = this.mapPhenotypes();
        this.lookupInPigeanMap();
    },
    render(createElement) {
        return createElement(Template);
    },
}).$mount("#app");
