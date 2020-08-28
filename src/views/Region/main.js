import Vue from "vue";
import * as d3 from "d3";
import _ from "lodash";

import Template from "./Template.vue";
import store from "./store.js";

import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import AssociationsTable from "@/components/AssociationsTable";
import PhenotypeSignalMixed from "@/components/PhenotypeSignalMixed";
import Documentation from "@/components/Documentation";
import IGV from "@/components/igv/IGV.vue";
import IGVEvents, { IGV_LOCUSCHANGE } from "@/components/igv/IGVEvents";
import LocusZoom from "@/components/lz/LocusZoom";
import LocusZoomAssociationsPanel from "@/components/lz/panels/LocusZoomAssociationsPanel";
import CredibleSetSelectPicker from "@/components/CredibleSetSelectPicker";
import AnnotationMethodSelectPicker from "@/components/AnnotationMethodSelectPicker";
import LunarisLink from "@/components/LunarisLink";
import Autocomplete from "@/components/Autocomplete.vue";
import GeneSelectPicker from "@/components/GeneSelectPicker.vue";

import { BButton, BootstrapVueIcons } from "bootstrap-vue";

import uiUtils from "@/utils/uiUtils";
import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

import Formatters from "@/utils/formatters"

Vue.config.productionTip = false;
Vue.component("b-button", BButton);
Vue.use(BootstrapVueIcons);

new Vue({
    store,
    components: {
        PageHeader,
        PageFooter,
        Alert,
        Documentation,
        LunarisLink,

        LocusZoom,
        LocusZoomAssociationsPanel,
        AssociationsTable,

        PhenotypeSignalMixed,

        IGV,

        CredibleSetSelectPicker,
        AnnotationMethodSelectPicker,
        PhenotypeSelectPicker,
        Autocomplete,
        GeneSelectPicker,
    },

    created() {
        // get the disease group and set of phenotypes available
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("queryRegion");
    },

    mounted() {
        IGVEvents.$on(IGV_LOCUSCHANGE, locus => {
            const phenotype = this.$store.state.phenotype.name;
            const region = Formatters.igvLocusFormatter(locus);
            // I keep on forgetting this 'q'
            this.$store.dispatch("credibleSets/query", {
                q: `${phenotype},${region}`
            });
        });

        // this.$children[0].$refs.locuszoom.addAssociationsPanelComponent('T2D')
    },

    render(createElement) {
        return createElement(Template);
    },

    data() {
        return {
            counter: 0,

            // page controls
            pValue: null,
            fold: null,

            currentAssociationsPanel: null,

            selectedCredibleSets: []
        };
    },

    methods: {
        ...uiUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,
        applyFilter(filter) {
            this.$children[0].$refs.locuszoom.applyFilter(filter)
        },
        requestCredibleSets(eventData) {
            const { start, end } = eventData;
            if (!!start && !!end) {
                const queryString = `${this.$store.state.phenotype.name},${this.$store.state.chr}:${Number.parseInt(start)}-${Number.parseInt(end)}`
                this.$store.dispatch('credibleSets/query', { q: queryString });
            }
        },
        exploreExpanded() {
            this.$store.commit('setLocus', {
                chr: this.$store.state.chr,
                start: this.$store.state.start - 50000,
                end: this.$store.state.end + 50000,
            });
            this.$store.dispatch('queryRegion');
        },

        // LocusZoom has "Panels"
        addAssociationsPanel(event) {
            const { phenotype } = event;
            let finishHandler = this.updateAssociationsTable;
            const newAssociationsPanelId = this.$children[0].$refs.locuszoom.addAssociationsPanel(
                phenotype,
                finishHandler
            );
            return newAssociationsPanelId;
        },
        updateAssociationsTable(data) {
            this.$store.commit(`associations/setResponse`, data);
        },
        // LocusZoom has "Panels"
        addCredibleVariantsPanel(event) {
            const { phenotype, credibleSetId } = event;
            this.$children[0].$refs.locuszoom.addCredibleVariantsPanel(phenotype, credibleSetId,
                // next arg for dataLoaded callback, second arg for dataResolved callback, last arg for error callback
                function(dataLoadedResponse) {
                    // TODO: callbacks for creating a new table column for credible sets might go here
                }
            )
        },
        addAnnotationIntervalsPanel(event) {
            const { annotation, method } = event;
            this.$children[0].$refs.locuszoom.addAnnotationIntervalsPanel(annotation, method);
        },
        // TODO: refactor to closure for extra programmer points
        // TODO: does the idea of using components handle this problem?
        updateAssociationsPanel(phenotype) {
            if (this.currentAssociationsPanel) {
                this.$children[0].$refs.locuszoom.plot.removePanel(
                    this.currentAssociationsPanel
                );
            }
            this.currentAssociationsPanel = this.addAssociationsPanel({
                phenotype
            });
        },
        filterOnPValueAndFold(vals, filterValue) {
            let extractedItemVals = Object.entries(vals).reduce((acc, items) => {
                const [preKey, fieldValue] = items;
                const fieldKey = preKey.split(':')[1];  // remove the namespacing information from the key to get the field leftover
                acc[fieldKey] = fieldValue;
                return acc;
            }, {});

            let pValuePred = !!filterValue.pValue ? _.lte(extractedItemVals.pvalue, filterValue.pValue) : true;  // these are case sensitive right now, with these being proper casing (should standardize)
            let foldPred = !!filterValue.fold ? _.gte(extractedItemVals.fold, filterValue.fold) : true;

            return pValuePred && foldPred;
        }
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

        documentationMap() {
            return {
                phenotype:
                    this.$store.state.phenotype &&
                    this.$store.state.phenotype.description
            };
        },

        genes() {
            return this.$store.state.genes.data.filter(function (gene) {
                return gene.source == "symbol";
            });
        },

        phenotypes() {
            return [this.$store.state.phenotype];
        },

        credibleSets() {
            return this.$store.state.credibleSets.data;
        },

        regionString() {
            let chr = this.$store.state.chr;
            let start = Formatters.intFormatter(this.$store.state.start);
            let end = Formatters.intFormatter(this.$store.state.end);
            return Formatters.locusFormatter(chr, start, end);
        },

        // Give the top associations, find the best one across all unique
        // phenotypes available.
        topAssociations() {
            let data = this.$store.state.topAssociations.data;
            let assocMap = {};

            for (let i in data) {
                const assoc = data[i];

                // skip associations not part of the disease group
                if (
                    !this.$store.state.bioPortal.phenotypeMap[assoc.phenotype]
                ) {
                    continue;
                }

                const curAssoc = assocMap[assoc.phenotype];
                if (!curAssoc || assoc.pValue < curAssoc.pValue) {
                    assocMap[assoc.phenotype] = assoc;
                }
            }
            // region loaded, hide search
            uiUtils.hideElement("regionSearchHolder");
            // convert to an array, sorted by p-value
            return Object.values(assocMap).sort((a, b) => a.pValue - b.pValue);
        },

        // the associations in LZ format
        lzAssociations() {
            let data = this.$store.state.associations.data;
            let threshold = 1000 / data.length;
            let assocs = this.$store.state.associations.data
                .filter(v => v.pValue < 1e-5 || Math.random() < threshold)
                .map(v => {
                    return {
                        id: v.varId,
                        variant: v.varId,
                        position: v.position,
                        log_pvalue: -Math.log10(v.pValue),
                        ref_allele: v.reference
                    };
                });
            return assocs;
        },

        globalEnrichmentAnnotations() {
            // an array of annotations
            return _.uniqBy(this.$store.state.globalEnrichment.data, el =>
                JSON.stringify(
                    [el.annotation, !!el.method ? el.method : ""].join()
                )
            );
        },

        tissues() {
            // an array of tissue
            return _.uniq(
                this.$store.state.globalEnrichment.data
                    .filter(interval => !!interval.tissue)
                    .map(interval => interval.tissue)
            );
        },

        // TODO: refactor into IGV Utils
        tissueColorScheme() {
            return d3
                .scaleOrdinal()
                .domain(this.tissues)
                .range(d3.schemeSet1);
        },

        tissueScoring() {
            let groups = {};

            for (let i in this.$store.state.globalEnrichment.data) {
                let r = this.$store.state.globalEnrichment.data[i];
                let t = r.tissueId || "NA";
                let m = r.method || "NA";

                let key = `${t}_${m}_${r.annotation}`;
                let group = groups[key];
                let fold = r.SNPs / r.expectedSNPs;

                if (!group) {
                    groups[key] = {
                        minP: r.pValue,
                        maxFold: fold
                    };
                } else {
                    group.minP = Math.min(group.minP, r.pValue);
                    group.maxFold = Math.max(group.maxFold, fold);
                }
            }

            return groups;
        },
        jointFilters() {
            return {
                pValue: this.pValue,
                fold: this.fold,
            }
        }
    },
    watch: {
        jointFilters(newFilterThresholds) {
            console.log('joint filters reacting')
            this.applyFilter({
                fields: ['pvalue', 'fold'],
                value: newFilterThresholds,
                op: this.filterOnPValueAndFold
            })
        },
        // pValue(minP) {
        //     // the filter op takes input on the left arg (e.g. 'minP := filter.value, x >= minP')
        //     this.applyFilter({
        //         field: 'pvalue',
        //         value: minP,
        //         op: _.gte,
        //     })
        // },
        // fold(maxF) {
        //     // the filter op takes input on the left arg (e.g. 'maxF := filter.value, x <= maxF')
        //     this.applyFilter({
        //         field: 'fold',
        //         value: maxF,
        //         op: _.lte,
        //     })
        // },
        "$store.state.bioPortal.phenotypeMap": function (phenotypeMap) {
            let param = this.$store.state.phenotypeParam;

            // if there's a phenotypeParam, then pick that phenotype
            if (param) {
                let phenotype = phenotypeMap[param];

                if (phenotype) {
                    this.$store.commit("setSelectedPhenotype", phenotype);
                }
            }
        },

        "$store.state.phenotype": function (phenotype) {
            // I don't like mixing UI effects with databinding - Ken
            uiUtils.hideElement("phenotypeSearchHolder");

            if (phenotype) {
                this.$store.dispatch("globalEnrichment/query", {
                    q: phenotype.name
                });
                this.$store.dispatch("credibleSets/query", {
                    q: `${phenotype.name},${this.$store.state.chr}:${this.$store.state.start}-${this.$store.state.end}`
                });
            }
        },

        topAssociations(top) {
            if (!this.selectedPhenotype && top.length > 0) {
                let topAssoc = top[0];
                let topPhenotype = this.$store.state.bioPortal.phenotypeMap[
                    topAssoc.phenotype
                ];
                this.$store.commit("setSelectedPhenotype", topPhenotype);
            }
        },

        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        }
    }
}).$mount("#app");
