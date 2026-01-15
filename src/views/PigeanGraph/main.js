import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import keyParams from "@/utils/keyParams";
import pigeanUtils from "@/utils/pigeanUtils.js";
import bioIndexUtils from "@/utils/bioIndexUtils";
import uiUtils from "@/utils/uiUtils";
import sessionUtils from "@/utils/sessionUtils";
import TooltipDocumentation from "@/components/TooltipDocumentation.vue";
import PigeanTable from "@/components/PigeanTable.vue";
import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue";
import PigeanGraphViz from "@/components/PigeanGraphViz.vue";
import { pageMixin } from "@/mixins/pageMixin.js";
import { BIO_INDEX_HOST, DEFAULT_SIGMA } from "@/utils/bioIndexUtils";

new Vue({
    store,
    components: {
        TooltipDocumentation,
        PigeanTable,
        SearchHeaderWrapper,
        PigeanGraphViz,
    },
    mixins: [pageMixin],
    data() {
        return {
            pigeanPhenotypeMap: {},
            phenotypeSearchKey: null,
            newPhenotypeSearchKey: null,
            factorTableConfig: {
                fields: [
                    { key: "label", label: "Mechanism", sortable: true },
                    {
                        key: "gene_set_score",
                        label: "Relevance to trait",
                        sortable: true,
                    },
                    {
                        key: "top_gene_sets",
                        label: "Top gene sets",
                        sortable: false,
                        tdClass: "wrapped-cell-content"
                    },
                    {
                        key: "top_genes",
                        label: "Top genes",
                        sortable: false,
                        tdClass: "wrapped-cell-content"
                    },
                ],
                queryParam: "cluster",
                sortBy: "gene_set_score",
            },
            mechanismTooltip:
                "Genes with genetic support for this trait " +
                "and gene sets with strong effects on genetic support " +
                "for the trait are compiled into a membership matrix. " +
                "Bayesian non-negative matrix factorization with " +
                "automatic relevance determination is then applied " +
                "to the membership matrix to determine latent factors, " +
                "each of which is characterized by loadings of both " +
                "genes and gene sets within the factor. The relevance " +
                "of each factor to this trait is calculated as the sum " +
                "of gene set effects within the factor.",
        };
    },
    computed: {
        mechanismMap() {
            let data = this.$store.state.pigeanFactor.data;
            let mechanisms = {};
            data.forEach((item) => {
                if (!mechanisms[item.factor]) {
                    mechanisms[item.factor] = {
                        label: item.label,
                        score: item.gene_set_score,
                    };
                }
            });
            return mechanisms;
        },
        pigeanGraphData() {
            const data = this.$store.state.pigeanGraph?.data;
            if (!data || !Array.isArray(data) || data.length === 0) {
                return null;
            }
            console.log("pigeanGraphData", data[0]);
            return data[0];
        },
        pigeanMap() {
            return this.pigeanPhenotypeMap;
        },
        documentationMap() {
            return this.$store.state.bioPortal.documentations || {};
        },
        rawPhenotypes() {
            return this.$store.state.bioPortal.phenotypes;
        },
        phenotypesInSession() {
            if (this.$store.state.phenotypesInSession == null) {
                return this.$store.state.bioPortal.phenotypes;
            } else {
                return this.$store.state.phenotypesInSession;
            }
        },
        filteredPhenotypesForSearch() {
            if (!this.phenotypeSearchKey) {
                return [];
            }

            let phenotypes = this.phenotypesInSession;
            let searchKeys = this.phenotypeSearchKey.split(" ");

            // Filter phenotypes that match search
            let filtered = phenotypes.filter(item => {
                const description = (item.phenotype_name || item.description || "").toLowerCase();
                let isInPhenotype = 0;

                searchKeys.forEach(w => {
                    if (description.includes(w.toLowerCase())) {
                        isInPhenotype++;
                    }
                });

                return isInPhenotype === searchKeys.length;
            });

            // Sort by length of display name (shorter first)
            return filtered.sort((a, b) => {
                const aName = (a.phenotype_name || a.description || "").length;
                const bName = (b.phenotype_name || b.description || "").length;
                return aName - bName;
            });
        },
        traitGroups() {
            return bioIndexUtils.TRAIT_GROUPS;
        },
        currentPhenotypeId() {
            // Get phenotype ID from store
            const phenotype = this.$store.state.phenotype;
            if (phenotype) {
                // Return phenotype name/id - could be phenotype.name or phenotype.phenotype
                return phenotype.name || phenotype.phenotype || null;
            }
            return null;
        },
    },
    watch: {
        "$store.state.phenotype": function (phenotype) {
            if (phenotype) {
                keyParams.set({ phenotype: phenotype.name });
                uiUtils.hideElement("phenotypeSearchHolder");
            }
        },
    },
    async created() {
        this.$store.dispatch("bioPortal/getDiseaseSystems");
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        await this.$store.dispatch("getPigeanPhenotypes");
        this.pigeanPhenotypeMap =
            pigeanUtils.mapPhenotypes(this.$store.state.pigeanAllPhenotypes.data);
        this.lookupInPigeanMap();
    },
    mounted() {
    },
    methods: {
        ...uiUtils,
        ...sessionUtils,
        setSelectedPhenotype(PHENOTYPE) {
            // Check if phenotype exists in PIGEAN map first
            let phenotypeName = PHENOTYPE.phenotype || PHENOTYPE.name;
            let oldStylePhenotype = this.pigeanPhenotypeMap[phenotypeName];

            if (!oldStylePhenotype) {
                // If not in PIGEAN map, check if it's PIGEAN format and convert
                if (PHENOTYPE.phenotype_name) {
                    oldStylePhenotype = pigeanUtils.toOldStyle(PHENOTYPE);
                } else {
                    // Regular phenotype format (from phenotypesInSession)
                    oldStylePhenotype = PHENOTYPE;
                }
            }

            this.newPhenotypeSearchKey = oldStylePhenotype.description || oldStylePhenotype.phenotype_name;
            this.phenotypeSearchKey = null;
            // Dispatch selectedPhenotype - this will automatically trigger queryPhenotype
            this.$store.dispatch("selectedPhenotype", oldStylePhenotype);
        },
        ifPhenotypeInSearch(DESCRIPTION) {
            if (!this.phenotypeSearchKey) {
                return null;
            }
            let searchKeys = this.phenotypeSearchKey.split(" ");
            let isInPhenotype = 0;

            searchKeys.map((w) => {
                if (DESCRIPTION.toLowerCase().includes(w.toLowerCase())) {
                    isInPhenotype++;
                }
            });

            return isInPhenotype == searchKeys.length ? true : null;
        },
        lookupInPigeanMap() {
            let name = keyParams.phenotype;
            let phenotype = this.pigeanPhenotypeMap[name];
            if (phenotype) {
                this.$store.state.selectedPhenotype = phenotype;
                keyParams.set({ phenotype: phenotype.name });
                this.$store.state.traitGroupToQuery = phenotype.trait_group;
                keyParams.set({ traitGroup: phenotype.trait_group });
            } else {
                // Set defaults if no phenotype in URL
                if (!keyParams.genesetSize) {
                    keyParams.set({ genesetSize: "small" });
                    this.$store.commit("setGenesetSize", "small");
                }
                if (!keyParams.traitGroup) {
                    keyParams.set({ traitGroup: "portal" });
                    this.$store.commit("setTraitGroup", "portal");
                }
            }
            //Initial query. Should only happen once.
            this.$store.dispatch("queryPhenotype");
        },
    },
    render(createElement) {
        return createElement(Template);
    },
}).$mount("#app");

