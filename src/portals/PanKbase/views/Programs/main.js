import Vue from "vue";
import Template from "./Template.vue";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import { getPankbaseContent } from "@/portals/PanKbase/utils/content";
import dataConvert from "@/utils/dataConvert";

new Vue({
    components: {
    },
    mixins: [pankbaseMixin],
    data() {
        return {
            pageId: "pankbase_programs",
            about: "",
            programs: [],
        };
    },
    watch: {},
    async created() {
        let content = await getPankbaseContent(this.pageId, false, true);
        this.about = content.body;
        let allPrograms = dataConvert.csv2Json(content.field_data_points);
        allPrograms.forEach(item => item.comingSoon = item.comingSoon === 'TRUE');
        this.programs = allPrograms;

    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
