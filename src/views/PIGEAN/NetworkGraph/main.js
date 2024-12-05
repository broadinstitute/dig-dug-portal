import Vue from "vue";
import Template from "./Template.vue";
import store from "./store";

import NetworkGraph from "@/components/NetworkGraph.vue";
import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue";
import GenesetSizeSelectPicker from "@/components/GenesetSizeSelectPicker.vue";
import keyParams from "@/utils/keyParams";
import pigeanUtils from "@/utils/pigeanUtils.js";
import { pageMixin } from "@/mixins/pageMixin.js";
new Vue({
    store,
    components: {
        NetworkGraph,
        SearchHeaderWrapper,
        GenesetSizeSelectPicker,
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
        genesetSize() {
            return keyParams.genesetSize || "small";
        },
    },
    methods: {
        setSelectedPhenotype(PHENOTYPE) {
            let oldStylePhenotype = pigeanUtils.toOldStyle(PHENOTYPE);
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
        searchPhenotype(){
            let phenotypeToSearch = this.selectedPhenotype 
                || this.pigeanPhenotypeMap[keyParams.phenotype];
            this.$store.dispatch("sendSearch", phenotypeToSearch);
        },
    },
    async created() {
        this.$store.dispatch("bioPortal/getDiseaseSystems");
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        await this.$store.dispatch("getPigeanPhenotypes");
        this.pigeanPhenotypeMap = 
            pigeanUtils.mapPhenotypes(this.$store.state.pigeanAllPhenotypes.data);
        let initialPhenotype = this.pigeanPhenotypeMap[keyParams.phenotype];
        this.$store.dispatch("sendSearch", initialPhenotype)
    },
    render(createElement) {
        return createElement(Template);
    },
}).$mount("#app");
