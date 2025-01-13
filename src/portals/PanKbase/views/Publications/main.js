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
            categories: [],
            perPage: 10,
            currentPage: 1,
            searchString: "",
            searchCategory: ""
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
        },
        stringMatch(pub){
            let publication = pub['Publication'].toLowerCase();
            let description = pub['Description'].toLowerCase();
            let search = this.searchString.toLowerCase();
            return this.searchString === '' 
                || publication.includes(search)
                || description.includes(search);
        },
        categoryMatch(pub){
            return this.searchCategory === ''
                || pub['Category'] === this.searchCategory;
        }
    },
    computed: {
        pubSearchResults(){
            return this.publications.filter(p =>
                this.categoryMatch(p) && this.stringMatch(p)
            );
        },
    },
    watch: {},
    async created() {
        let allContent = await getPankbaseContent(this.pageId, false, true);
        this.about = allContent.body;
        let allPubs = dataConvert.csv2Json(allContent.field_data_points);
        allPubs.forEach(p => {
            if (!this.categories.includes(p['Category'])){
                this.categories.push(p['Category']);
            }
        });
        this.publications = allPubs;
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
