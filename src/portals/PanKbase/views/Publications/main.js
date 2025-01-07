import Vue from "vue";
import Template from "./Template.vue";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import { getPankbaseContent, highlightIntro } from "@/portals/PanKbase/utils/content";
import dataConvert from "@/utils/dataConvert";

new Vue({
    components: {
    },
    mixins: [pankbaseMixin],
    data() {
        return {
            pageId: "pankbase_publications",
            about: "",
            publications: []
        };
    },
    computed: {
        publicationsInfo(){
            return this.about;
        }
    },
    watch: {},
    async created() {
        let allContent = await getPankbaseContent(this.pageId, false, true);
        this.about = allContent.body;
        this.publications = dataConvert.csv2Json(allContent.field_data_points);
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
