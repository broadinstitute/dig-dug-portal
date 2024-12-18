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
            pageId: "pankbase_tutorials",
            about: ""
        };
    },
    computed: {
        tutorialsInfo(){
            return this.about;
        }
    },
    watch: {},
    async created() {
        let content = await getPankbaseContent(this.pageId, true);
        this.about = content;
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
