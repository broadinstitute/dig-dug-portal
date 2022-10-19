import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import uiUtils from "@/utils/uiUtils";
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
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getDiseaseSystems");
        this.$store.dispatch("bioPortal/getPhenotypes");
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
        getPageContent(NID, CHAPTER) {
            console.log(NID, CHAPTER);
            this.$store.dispatch("kp4cd/getContentByID", NID);
            this.$store.dispatch("page", NID);
            if (!!CHAPTER) {
                let chapters = document.querySelectorAll(".chapter");
                chapters.forEach(chapter => {
                    chapter.setAttribute("class", "chapter closed")
                })
                document.getElementById(CHAPTER).setAttribute("class", "chapter open");
            }
        }
    },

    computed: {

        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        },

        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;

            if (contents.length === 0) {
                return {};
            }
            return contents[0];
        },
        pageInfo() {
            let contents = this.$store.state.kp4cd.contentByID;

            if (contents.length === 0) {
                return {};
            }
            return contents;
        },

        helpTOC() {
            let bookData = this.$store.state.kp4cd.helpBook;

            if (bookData.length > 0) {
                if (!this.$store.state.page) {
                    this.$store.dispatch("kp4cd/getContentByID", bookData[0].nid_1);
                } else if (!!this.$store.state.page) {
                    this.$store.dispatch("kp4cd/getContentByID", this.$store.state.page);
                }
            }

            let contents = {};

            bookData.map(p => {

                if (!contents[p.title_2]) {
                    contents[p.title_2] = { "nid": p.nid_2, "title": p.title_2, "pages": [] }
                }

                contents[p.title_2]["pages"].push({ "nid": p.nid, "title": p.title });


            })

            if (contents.length === 0) {
                return {};
            }
            return contents;
        },
        diseaseInSession() {
            if (this.$store.state.diseaseInSession == null) {
                return "";
            } else {
                return this.$store.state.diseaseInSession;
            }
        },
        phenotypesInSession() {
            if (this.$store.state.phenotypesInSession == null) {
                return this.$store.state.bioPortal.phenotypes;
            } else {
                return this.$store.state.phenotypesInSession;
            }
        },
        rawPhenotypes() {
            return this.$store.state.bioPortal.phenotypes;
        },
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
            this.$store.dispatch("kp4cd/getHelpBook");
        },

    }
}).$mount("#app");
