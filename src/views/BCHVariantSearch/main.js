import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";
import { pageMixin } from "@/mixins/pageMixin";
import { match, query } from "@/utils/bioIndexUtils";
import BCHVariantSearch from "@/components/BCHVariantSearch.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
Vue.config.productionTip = false;

new Vue({
    store,
    mixins: [pageMixin],

    components: { 
        PageHeader,
        PageFooter,
        //bchtest,
        BCHVariantSearch },

    data() {
        return {
            searchCriteria: [],
            matchingGenes: [],
            datasets: ["Farhan2019_ALS_eu"]
        };
    },
    created() {
        this.$store.dispatch("queryGeneName", this.$store.state.geneName);
        this.$store.dispatch("bioPortal/getDiseaseGroups");
    },

    render(createElement, context) {
        return createElement(Template);
    },
    computed: {
        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;
            if (contents.length === 0) {
                return {};
            }
            return contents[0];
        },

        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        },
        
        genes() {
            return this.$store.genes.data;   
        },

        region() {
            return this.$store.getters.region;
        },
        selectedGene() {
            return this.searchCriteria
                .filter(v => {
                    return v.field === "gene";
                })
                .map(v => v.threshold);
        },
        selectedDataset() {
            return this.searchCriteria
                .filter(v => {
                    return v.field === "dataset";
                })
                .map(v => v.threshold);
        }
    },
    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
        region(region) {
            console.log("watch region: "+region);
            //this.hideElement("variangeneSearchHolder");
            if(typeof region !== 'undefined'){
                this.$store.dispatch("queryGeneRegion", region);
            }
            
        },
        selectedGene(selectedGene) {
            //alert(selectedGene);
            this.$store.dispatch("queryGeneName", selectedGene);
        }
    },
    methods: {
        async lookupGenes(input) {
            if (!!input) {
                let matches = await match("gene", input, { limit: 10 });
                this.matchingGenes = matches;
            }
        }
    }
}).$mount("#app");
