import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import Documentation from "@/components/Documentation.vue";
import uiUtils from "@/utils/uiUtils";
import sortUtils from "@/utils/sortUtils";
import regionUtils from "@/utils/regionUtils";
import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import GeneSelectPicker from "@/components/GeneSelectPicker.vue";
import { isEqual } from "lodash";


import CriterionListGroup from "@/components/criterion/group/CriterionListGroup.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import CredibleSetSelectPicker from "@/components/CredibleSetSelectPicker";
import AnnotationSelectPicker from "@/components/AnnotationSelectPicker";
import TissueSelectPicker from "@/components/TissueSelectPicker";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import FilterEffectDirection from "@/components/criterion/FilterEffectDirection.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";

import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

new Vue({
    store,
    modules: { regionUtils },
    components: {
        PageHeader,
        PageFooter,
        Alert,
        PhenotypeSelectPicker,
        Documentation,
        GeneSelectPicker,
        CriterionListGroup,
        CriterionFunctionGroup,
        CredibleSetSelectPicker,
        AnnotationSelectPicker,
        TissueSelectPicker,
        FilterPValue,
        FilterEffectDirection,
        FilterEnumeration,
        FilterGreaterThan
    },

    data() {
        return {
            region: null,
            locus: null,
            credibleSetsData: [],
            credibleSetsDataSorted: [],
        };
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
    },

    render(createElement, context) {
        return createElement(Template);
    },

    methods: {
        ...uiUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,
        async onGeneChange(gene) {
            let locus = await regionUtils.parseRegion(gene, true, 50000);

            if (locus) {
                this.locus = locus
            }
        },
        getOptions() {
            console.log(this.locus, this.$store.state.phenotype)
            this.requestCredibleSets();
        },
        clearAllSearch() {
            this.locus = null;
            this.$store.state.phenotype = null;
        },
        requestCredibleSets() {
            let that = this;
            let phenotype = this.$store.state.phenotype;

            this.$store.dispatch("credibleSets/clear");
            const queryString = `${phenotype.name},${this.locus.chr
                }:${Number.parseInt(this.locus.start)}-${Number.parseInt(this.locus.end)}`;
            that.$store.dispatch("credibleSets/query", {
                q: queryString,
                append: true
            });

        },
        addCredibleSets(event) {
            console.log(event);
            const { phenotype, credibleSetId } = event;
            if (credibleSetId !== "computed") {
                this.requestCredibleVariants(event.credibleSetId);

            } else if (credibleSetId === "computed") {
                // pass LocusZoom the page phenotype (which would have been what controlled the credible sets call in the first place)
                /*this.$children[0].$refs.locuszoom.addComputedCredibleVariantsPanel(
                    this.$store.state.phenotype.name
                );*/
            }
        },
        requestCredibleVariants(credibleSetId) {
            let that = this;
            let phenotype = this.$store.state.phenotype;

            this.$store.dispatch("credibleVariants/clear");
            const queryString = `${phenotype.name},${credibleSetId}`;
            that.$store.dispatch("credibleVariants/query", {
                q: queryString,
                append: true
            });

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
        phenotypeMap() {
            return this.$store.state.bioPortal.phenotypeMap;
        },
        credibleSets() {
            return this.$store.state.credibleSets.data;
        },
        credibleVariants() {
            return this.$store.state.credibleVariants.data;
        },
        globalEnrichmentAnnotations() {
            // an array of annotations
            let annotations = sortUtils.uniqBy(
                this.$store.state.globalEnrichment.data,
                el => el.annotation
            );
            return annotations;
        },
        globalEnrichmentTissues() {
            let tissues = sortUtils.uniqBy(
                this.$store.state.globalEnrichment.data,
                el => el.tissue
            );
            //sort the tissues
            return tissues;
        }
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
        phenotypes: {
            handler(newData, oldData) {
                if (!isEqual(newData, oldData)) {
                    this.setPhenotypeParams(newData);
                }
            },
            deep: true
        },
        region() {
            if (this.region.includes(":") && this.region.includes("-")) {
                this.locus = {}
                this.locus.chr = this.region.split(":")[0];
                this.locus.start = this.region.split(":")[1].split("-")[0];
                this.locus.end = this.region.split(":")[1].split("-")[1];
            }
        },
        credibleVariants(data) {
            if (!!data.length) {

                let tempObj = {};

                tempObj.id = data[0].credibleSetId;
                tempObj.data = data;

                this.credibleSetsData.push(tempObj);
            }
        },
        credibleSetsData(data) {
            console.log("updated");
            //console.log(data);
            this.credibleSetsDataSorted = [];
            let csdIndex = 0;

            data.map(cs => {

                cs.data.map(csv => {
                    csv.colorIndex = csdIndex;
                    this.credibleSetsDataSorted.push(csv);
                })
                csdIndex++;
            })
            sortUtils.sortEGLTableData(
                this.credibleSetsDataSorted, "position", true, false
            );
        }
        /*'$store.state.phenotype'() {
            console.log(this.$store.state.phenotype.name);
        }*/
    }
}).$mount("#app");
