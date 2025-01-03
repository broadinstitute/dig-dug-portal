import Vue from "vue";
import Template from "./Template.vue";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import { getPankbaseContent } from "@/portals/PanKbase/utils/content";

new Vue({
    components: {
    },
    mixins: [pankbaseMixin],
    data() {
        return {
            pageId: "pankbase_metadata_data_standards",
            about: ""
        };
    },
    computed: {
        metadataInfo(){
            return this.about;
        },
    },
    watch: {},
    async created() {
        let content = await getPankbaseContent(this.pageId, true);
        let tag = "<p>"
        let newTag = "<p class='page-info'>"
        this.about = content.replace(tag, newTag);
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
