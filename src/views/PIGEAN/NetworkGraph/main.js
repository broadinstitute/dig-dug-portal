import Vue from "vue";
import Template from "./Template.vue";
import store from "./store";

import NetworkGraph from "@/components/NetworkGraph.vue";
import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue";
import keyParams from "@/utils/keyParams";
import { pageMixin } from "@/mixins/pageMixin.js";
new Vue({
    store,
    components: {
        NetworkGraph,
        SearchHeaderWrapper,
    },
    mixins: [pageMixin],
    data() {
        return {
            pigeanPhenotypeMap: {},
            phenotypeSearchKey: null,
            newPhenotypeSearchKey: null,
            selectedPhenotype: null,
            traitGroups: {
                portal: "A2F",
                gcat_trait:"GWAS Catalog",
                rare_v2: "Orphanet"
            },
        };
    },
    computed: {
        phenotype() {
            let currentPhenotype = keyParams.phenotype || "";
            console.log("view phenotype: ", currentPhenotype);
            return currentPhenotype;
        },
        genesetSize() {
            return keyParams.genesetSize || "small";
        },
    },
    methods: {
        setSelectedPhenotype(PHENOTYPE) {
            let oldStylePhenotype = this.toOldStyle(PHENOTYPE);
            this.newPhenotypeSearchKey = oldStylePhenotype.description;
            this.phenotypeSearchKey = null;
            this.selectedPhenotype = oldStylePhenotype;
        },
        ifPhenotypeInSearch(DESCRIPTION) {
            let searchKeys = this.phenotypeSearchKey.split(" ");
            let isInPhenotype = 0;

            searchKeys.map((w) => {
                if (DESCRIPTION.toLowerCase().includes(w.toLowerCase())) {
                    isInPhenotype++;
                }
            });

            return isInPhenotype == searchKeys.length ? true : null;
        },
        toOldStyle(newStylePhenotype){
            let oldStyle = structuredClone(newStylePhenotype);
            oldStyle.description = newStylePhenotype.phenotype_name;
            oldStyle.name = newStylePhenotype.phenotype;
            oldStyle.group = newStylePhenotype.display_group;
            return oldStyle;
        },
        searchPhenotype(){
            this.$store.dispatch("onPhenotypeChange", this.selectedPhenotype);
        }
    },
    async created() {
        this.$store.dispatch("bioPortal/getDiseaseSystems");
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        await this.$store.dispatch("getPigeanPhenotypes");
        let initialPhenotype = {
            name: keyParams.phenotype
        };
        this.$store.dispatch("onPhenotypeChange", initialPhenotype)

    },
    render(createElement) {
        return createElement(Template);
    },
}).$mount("#app");
