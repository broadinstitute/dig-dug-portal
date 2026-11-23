import { mountPage } from "@/utils/pageSetup";
import Template from "./Template.vue";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import { getPankbaseContent } from "@/portals/PanKbase/utils/content";
import dataConvert from "@/utils/dataConvert";

// @vue/component
mountPage(Template, {
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
});
