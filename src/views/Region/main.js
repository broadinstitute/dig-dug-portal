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

import { igvLocusFormatter } from "@/utils/formatters"

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
            return igvLocusFormatter(locus)
        },
        addCredibleSetsTracks: function () {

            if(!!this.$store.state.currentCredibleSet && !!this.$store.state.phenotype){

                // Add Tracks
                this.$children[0].$refs.igv.addIGVTrack(IGVCredibleVariantsTrack, {
                    data: {
                        phenotype: this.$store.state.phenotype.name,
                        credibleSetId: this.$store.state.currentCredibleSet,
                        posteriorProbability: true,
                        visualization: 'gwas',
                    }
                });
                // this.$children[0].$refs.igv.addIGVTrack(IGVCredibleVariantsTrack, {
                //     data: {
                //         phenotype: this.$store.state.phenotype.name,
                //         credibleSetId: this.$store.state.currentCredibleSet,
                //         posteriorProbability: false,  // logarithm
                //         visualization: 'gwas',
                //     }
                // });

                // Add to Table

            }


        },
        addIntervalsTrack: function () {
            if (!!this.$store.state.currentTissue) {
                this.$children[0].$refs.igv.addIGVTrack(IGVIntervalTrack, {
                    data: {
                        tissue: this.$store.state.currentTissue,
                        annotationScoring: this.annotationScoring,
                        pValue: this.pValue,
                        beta: this.beta,
                    }
                });
            }
        },
        addIntervalsTracksForAnnotation: function () {
            console.log('add intervals tracks', this.globalEnrichmentByAnnotation)
            if (!!this.$store.state.currentAnnotation) {
                // TODO: refactor to JSON selectors, or to lodash chaining?
                const annotationGroups = _.groupBy(this.globalEnrichmentByAnnotation[this.$store.state.currentAnnotation], 'tissue.description');
                Object.keys(annotationGroups)
                    .forEach(annotationKey => {
                        annotationGroups[annotationKey].forEach(annotation => {
                            if (annotation.pValue > this.pValue && annotation.SNPs / annotation.expectedSNPs > this.beta) {
                                this.$children[0].$refs.igv.addIGVTrack(IGVIntervalTrack, {
                                    data: {
                                        tissue: annotation.tissue.description,
                                        ancestry: annotation.ancestry,
                                        annotations: [this.$store.state.currentAnnotation],
                                        pValue: this.pValue,
                                        beta: this.beta,
                                        annotationScoring: this.annotationScoring,
                                    }
                                });
                            }
                        })
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
            return _.uniqBy(this.$store.state.globalEnrichment.data, 'annotation');
        },

        globalEnrichmentByAnnotation() {
            return _.groupBy(this.$store.state.globalEnrichment.data, 'annotation')
        },

        tissues() {
            return _.uniqBy(this.$store.state.globalEnrichment.data.filter(interval => !!interval.tissue).map(interval => interval.tissue), 'id');
        },

        annotationScoring() {
            let annotationScoring = this.$store.state.globalEnrichment.data.reduce((net, enrichment) => {
                    let tempNet = net;
                    if (!!enrichment.tissue) {
                        tempNet[enrichment.tissue.description] = net[enrichment.tissue.description] || {};
                        tempNet[enrichment.tissue.description][enrichment.annotation] = {};
                        tempNet[enrichment.tissue.description][enrichment.annotation]['pValue'] = enrichment.pValue;
                        tempNet[enrichment.tissue.description][enrichment.annotation]['beta'] = enrichment.SNPs / enrichment.expectedSNPs ;
                    }
                    return tempNet;
                }, {});
            return annotationScoring;
        },

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
            uiUtils.hideElement('phenotypeSearchHolder')
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

        "$store.state.start": function (start) {
            console.log(start)
        },
        "$store.state.end": function (end) {
            console.log(end)
        }
    }
}).$mount("#app");
