import { mountPage } from "@/utils/pageSetup";
import Template from "./Template.vue";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import { getPankbaseContent } from "@/portals/PanKbase/utils/content";

// @vue/component
mountPage(Template, {
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
});
