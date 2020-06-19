import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import LocusZoom from "@/components/LocusZoom";
import AssociationsTable from "@/components/AssociationsTable";
import PhenotypeSignalMixed from "@/components/PhenotypeSignalMixed";
import Documentation from "@/components/Documentation";

import IGV from "@/components/igv/IGV.vue"
import IGVAssociationsTrack from "@/components/igv/tracks/IGVAssociationsTrack.vue"
import IGVIntervalTrack from "@/components/igv/tracks/IGVIntervalTrack.vue"

import IGVCredibleVariantsTrack from "@/components/igv/tracks/IGVCredibleVariantsTrack.vue"

import TissueSelectPicker from "@/components/TissueSelectPicker"
import CredibleSetSelectPicker from "@/components/CredibleSetSelectPicker"
import AnnotationMethodSelectPicker from "@/components/AnnotationMethodSelectPicker"

import uiUtils from "@/utils/uiUtils";
import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

import Formatters from "@/utils/formatters"
import * as d3 from "d3";


Vue.config.productionTip = false;

new Vue({
    store,
    components: {
        PageHeader,
        PageFooter,
        Alert,
        Documentation,

        PhenotypeSelectPicker,
        LocusZoom,
        AssociationsTable,
        PhenotypeSignalMixed,

        IGV,
        IGVAssociationsTrack,
        IGVCredibleVariantsTrack,
        IGVIntervalTrack,

        TissueSelectPicker,
        CredibleSetSelectPicker,
        AnnotationMethodSelectPicker,
    },

    created() {
        // get the disease group and set of phenotypes available
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("queryRegion");
    },

    render(createElement, context) {
        return createElement(Template);
    },

    data() {
        return {
            counter: 0,
            pValue: 1.0,
            beta: 1.0,
        };
    },

    methods: {
        ...uiUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,
        formatIGV: function (locus) {
            return Formatters.igvLocusFormatter(locus)
        },
        addCredibleSetsTracks: function (credibleSet) {

            if (!!this.$store.state.currentCredibleSet || credibleSet && !!this.$store.state.phenotype) {

                // Add Tracks
                this.$children[0].$refs.igv.addIGVTrack(IGVCredibleVariantsTrack, {
                    data: {
                        phenotype: this.$store.state.phenotype.name,
                        credibleSetId: credibleSet,
                        posteriorProbability: true,
                        visualization: 'gwas',
                    }
                });
                this.$children[0].$refs.igv.addIGVTrack(IGVCredibleVariantsTrack, {
                    data: {
                        phenotype: this.$store.state.phenotype.name,
                        credibleSetId: this.$store.state.currentCredibleSet,
                        posteriorProbability: false,  // logarithm
                        visualization: 'gwas',
                    }
                });

                // TODO Add to Table

            }


        },
        addIntervalsTrack: function (tissue) {
            if (!!this.$store.state.currentTissue || tissue) {
                this.$children[0].$refs.igv.addIGVTrack(IGVIntervalTrack, {
                    data: {
                        tissue: tissue,
                    }
                });
            }
        },
        addIntervalsTrackForAnnotation: function () {
            if (!!this.$store.state.currentAnnotation) {

                this.$children[0].$refs.igv.addIGVTrack(IGVIntervalTrack, {
                    data: {
                        // tissue: [annotation.tissue],
                        annotations: [this.$store.state.currentAnnotation],
                        colorScheme: this.tissueColorScheme,
                        tissueScoring: this.tissueScoring,
                    }
                });

            }
        },
        routeResponseToModule(response) {
            // NOTE! assumes BOTHthat this is a bioIndex call with a registered bioIndex module, with the same symbolic name of the index.
            // TODO: move to store?
            // TODO: how about camel-kebabing?
            return this.$store.commit(`${response.index}/setResponse`, response);
        },
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
                phenotype: this.$store.state.phenotype.description,
            }
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
            let start = parseInt(this.$store.state.start).toLocaleString();
            let end = parseInt(this.$store.state.end).toLocaleString();

            return `${chr}:${start}-${end}`;
        },

        globalEnrichmentAnnotations() {
            // an array of annotations
            return _.uniqBy(this.$store.state.globalEnrichment.data, 'annotation');
        },

        tissues() {
            // an array of tissue
            return _.uniq(this.$store.state.globalEnrichment.data.filter(interval => !!interval.tissue).map(interval => interval.tissue));
        },

        tissueColorScheme() {
            return d3.scaleOrdinal().domain(this.tissues).range(d3.schemeSet1);
        },

        tissueScoring() {
            let tissueScoring = this.$store.state.globalEnrichment.data.reduce((net, enrichment) => {
                let tempNet = net;
                if (!!enrichment.annotation) {
                    tempNet[enrichment.annotation] = net[enrichment.annotation] || {};
                    tempNet[enrichment.annotation][enrichment.tissue] = {};
                    tempNet[enrichment.annotation][enrichment.tissue]['pValue'] = enrichment.pValue;
                    tempNet[enrichment.annotation][enrichment.tissue]['beta'] = enrichment.SNPs / enrichment.expectedSNPs;
                }
                return tempNet;
            }, {});
            return tissueScoring;
        },

        // globalEnrichmentAnnotationsFilteredByStats() {
        //     let tempGlobalEnrichmentByAnnotation = this.globalEnrichmentByAnnotation;
        //     Object.keys(tempGlobalEnrichmentByAnnotation).forEach(annotationKey => {
        //         tempGlobalEnrichmentByAnnotation[annotationKey] = this.globalEnrichmentByAnnotation[annotationKey].filter(enrichment =>
        //             this.tissueScoring[enrichment.annotation][enrichment.tissue].pValue < this.pValue &&
        //             this.tissueScoring[enrichment.annotation][enrichment.tissue].beta > this.beta
        //         );
        //     })
        //     return tempGlobalEnrichmentByAnnotation;
        // },

        // globalEnrichmentAnnotationsFilteredByStatsCount() {
        //     let tempGlobalEnrichmentByAnnotation = this.globalEnrichmentAnnotationsFilteredByStatsCount;
        //     Object.keys(tempGlobalEnrichmentByAnnotation).forEach(annotationKey => {
        //         // override the array with the length of the array
        //         tempGlobalEnrichmentByAnnotation[annotationKey] = tempGlobalEnrichmentByAnnotation[annotationKey].length;
        //     })
        //     return tempGlobalEnrichmentByAnnotation;
        // },

        // Give the top associations, find the best one across all unique
        // phenotypes available.
        topAssociations() {
            let data = this.$store.state.topAssociations.data;
            let assocMap = {};

            for (let i in data) {
                let assoc = data[i];

                // skip associations not part of the disease group
                if (
                    !this.$store.state.bioPortal.phenotypeMap[assoc.phenotype]
                ) {
                    continue;
                }

                let curAssoc = assocMap[assoc.phenotype];
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

            // phenotype data loaded, close search
            // uiUtils.hideElement("phenotypeSearchHolder");

            return assocs;
        },



    },
    watch: {
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
            uiUtils.hideElement('phenotypeSearchHolder');

            // this.$store.dispatch('associations/query', { q: `${this.$store.state.phenotype.name},${this.$store.state.chr}:${this.$store.state.start}-${this.$store.state.end}` });
            this.$store.dispatch('globalEnrichment/query', { q: this.$store.state.phenotype.name });
            this.$store.dispatch('credibleSets/query', { q: `${this.$store.state.phenotype.name},${this.$store.state.chr}:${this.$store.state.start}-${this.$store.state.end}` });
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
        },

        "$store.state.currentAnnotation": function (annotation) {
            if (!!annotation) {
                this.addIntervalsTrackForAnnotation(annotation);
            }
        },
        "$store.state.currentCredibleSet": function (credibleSet) {
            if (!!credibleSet) {
                this.addCredibleSetsTracks(credibleSet);
            }
        }
    }
}).$mount("#app");
