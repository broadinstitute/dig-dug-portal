import Vue from "vue";
import store from "./store.js";
import Template from "./Template.vue";
import BirdsDashboard from "./components/BirdsDashboard.vue";
import { pageMixin } from "@/mixins/pageMixin.js";
Vue.config.productionTip = false;

new Vue({
    store,
    modules: {},
    components: {
        BirdsDashboard,
    },
    mixins: [pageMixin],
    data() {
        return {};
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
            let diseaseGroup = this.$store.getters["bioPortal/diseaseGroup"];
            console.log(JSON.stringify(diseaseGroup));
            return diseaseGroup;
        },
    },
    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
    },

    methods: {},
    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
