import Vue from "vue";
import Template from "./Template.vue";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import "../../assets/filtering.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import { getPankbaseContent, highlightIntro } from "@/portals/PanKbase/utils/content";
import dataConvert from "@/utils/dataConvert";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterBasic from "@/components/criterion/FilterBasic.vue";

new Vue({
    components: {
        CriterionFunctionGroup,
        FilterEnumeration,
        FilterBasic
    },
    mixins: [pankbaseMixin],
    data() {
        return {
            pageId: "pankbase_publications",
            about: "",
            publications: [],
            perPage: 10,
            currentPage: 1
        };
    },
    methods: {
        extractAuthors(pubItem){
            let pubCite = pubItem.item['Publication'];
            let dotIndex = pubCite.indexOf(".");
            if (dotIndex === -1){
                return {authors: "", rest: pubCite};
            }
            let beforeDot = pubCite.slice(0, dotIndex + 1);
            let afterDot = pubCite.slice(dotIndex + 1);
            return {authors: beforeDot, rest: afterDot};
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
