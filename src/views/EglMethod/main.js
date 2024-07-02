import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import { BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVueIcons);

import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import Documentation from "@/components/Documentation.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import ResearchMethod from "@/components/eglt/ResearchMethod.vue";
import EffectorGenesPlotsLine from "@/components/eglt/EffectorGenesPlotsLine.vue";
import EffectorGenesTable from "@/components/eglt/EffectorGenesTable.vue";
import uiUtils from "@/utils/uiUtils";
import keyParams from "@/utils/keyParams";
import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

new Vue({
    store,
    components: {
        PageHeader,
        PageFooter,
        Alert,
        ResearchMethod,
        EffectorGenesPlotsLine,
        EffectorGenesTable,
        Documentation,
    },
    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDocumentations");
        this.$store.dispatch("kp4cd/getResearchMethod", keyParams.dataset);
        //this.$store.dispatch("effectorGenes/getDatasets", keyParams.trait); //for now, data from kp4cd
    },

    render(createElement, context) {
        return createElement(Template);
    },

    mounted() {
        window.addEventListener("scroll", this.onScroll)
    },
    beforeDestroy() {
        window.removeEventListener("scroll", this.onScroll)
    },

    methods: {
        ...uiUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,
        showElement(ELEMENT) {
            uiUtils.showElement(ELEMENT);
        },
        onResize(e) {
            this.windowWidth = window.innerWidth;
        },
        onScroll(e) {
            let windowTop = window.top.scrollY;


            let element = document.getElementsByClassName("top-level-header")[0];
            if (windowTop > this.tableTop()) {
                if (!element.classList.contains('fixed-header')) {
                    element.classList.add('fixed-header');
                }
            } else {
                if (element.classList.contains('fixed-header')) {
                    element.classList.remove('fixed-header');
                }
            }
        },
        appendCss(DATASET) {
            let file = document.createElement('link');
            file.rel = 'stylesheet';
            file.href = 'https://hugeampkpncms.org/sites/default/files/users/user1/egl_data/' + DATASET + '/' + DATASET + '.css'
            document.head.appendChild(file)
        },
        tableTop() {
            let eglTable = document.getElementsByClassName("EGLT-table")[0];
            let rect = eglTable.getBoundingClientRect();
            let scrollTop = document.documentElement.scrollTop ?
                document.documentElement.scrollTop : document.body.scrollTop;

            let tableTop = rect.top + scrollTop;

            return tableTop;
        },
    },

    computed: {
        dataset() {
            this.appendCss(keyParams.dataset);
            return keyParams.dataset;
        },
        trait() {

            let phenotypeName = null;

            this.$store.state.bioPortal.phenotypes.map(
                (x) => {

                    if (
                        x.name.toLowerCase() ==
                        keyParams.trait.toLowerCase()
                    ) {
                        phenotypeName = x.description;
                    }
                }
            );

            let prettyName = (phenotypeName != null) ? phenotypeName : keyParams.trait;

            return prettyName;
        },
        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        },
        phenotypes() {
            return this.$store.bioportal;
        },

        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;

            if (contents.length === 0) {
                return {};
            }
            return contents[0];
        },

        researchMethod() {
            let contents = this.$store.state.kp4cd.researchMethod;

            if (contents.length === 0) {
                return null;
            }
            return contents;
        },

        datasets() {
            let contents = this.$store.state.effectorGenes.datasets;
            if (contents.length === 0) {
                return null;
            }
            return contents;
        },

        effectorGenesData() {
            let contents = this.$store.state.effectorGenes.effectorGenes;
            if (contents.length === 0) {
                return null;
            }
            return contents;
        },
        effectorGenesGraph() {
            let contents = {
                line: EffectorGenesPlotsLine
            };

            return contents[this.$store.state.plotsConfig["type"]];
        },
        pageTitle() {
            return this.$store.state.pageTitle;
        }
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
    }
}).$mount("#app");
