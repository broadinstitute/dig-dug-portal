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
    computed: {
        programInfo(){
            return this.about;
        },
        allPrograms(){
            return this.programs;
        }
    },
    watch: {},
    async created() {
        let content = await getPankbaseContent(this.pageId, false, true);
        this.about = content.body;
        this.programs = dataConvert.csv2Json(content.field_data_points);
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
