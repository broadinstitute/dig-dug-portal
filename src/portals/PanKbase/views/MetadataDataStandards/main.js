import { mountPage } from "@/utils/pageSetup";
import Template from "./Template.vue";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import { getPankbaseContent, highlightIntro } from "@/portals/PanKbase/utils/content";

// @vue/component
mountPage(Template, {
    components: {
    },
    mixins: [pankbaseMixin],
    data() {
        return {
            pageId: "pankbase_metadata_data_standards",
            about: ""
        };
    },
    watch: {},
    async created() {
        let content = await getPankbaseContent(this.pageId, true);
        this.about = highlightIntro(content);
    },
});
