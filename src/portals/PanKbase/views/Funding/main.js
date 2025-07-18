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
            pageId: "pankbase_funding",
            content: null
        };
    },
    watch: {},
    async created() {
        let content = await getPankbaseContent(this.pageId, true);
        console.log(content);
        this.content = content;
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
