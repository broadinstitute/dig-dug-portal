import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import "../../assets/layout.css";
import "../../assets/mouseportal.css";
import "../../assets/mdkp_copy.css";

import MouseTissueSelect from "../../../../components/MouseTissueSelect.vue";
import MouseGeneSelect from "../../../../components/MouseGeneSelect.vue";

import { mouseMixin } from "@/portals/MousePortal/mixins/mouseMixin.js";
import { pageMixin } from "@/mixins/pageMixin.js";

new Vue({
    store,
    components: {
        MouseGeneSelect,
        MouseTissueSelect
    },
    mixins: [mouseMixin],
    data() {
        return {
        };
    },
    methods: {
        goToGene(gene){
            location.href = `/gene.html?gene=${gene}`;
        },
        goToTissue(tissue){
            console.log("coming soon");
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
    },
    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
    },
    async created() {
        this.$store.dispatch("bioPortal/getDiseaseSystems");
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
