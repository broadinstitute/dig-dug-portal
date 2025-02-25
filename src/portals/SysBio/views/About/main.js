import Vue from "vue";
import Template from "./Template.vue";

//import "../../assets/matkp-styles.css";

//import { matkpMixin } from "../../mixins/matkpMixin.js";

//import matkpHero from "@/portals/MATKP/components/matkp-hero.vue";
//import matkpAnatomogram from "@/portals/MATKP/components/matkp-anatomogram.vue";
import { getTextContent } from "@/portals/MATKP/utils/content.js";
import keyParams from "../../../../utils/keyParams.js";

//import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
const BIO_INDEX_HOST = "https://bioindex-dev.hugeamp.org";
// Use keyparams to do this

new Vue({
    components: {
        matkpHero,
        matkpAnatomogram,
    },
    mixins: [matkpMixin],

    data() {
        return {
            config: null,
            pageContent: {},
            fallbackId: "matkp_help",
            pages: {
                news: {
                    title: "News",
                    page_id: "matkp_news",
                    node: 682
                },
                help: {
                    title: "Help",
                    page_id: "matkp_help",
                    node: 683
                },
                collaborate: {
                    title: "Collaborate with MATKP",
                    page_id: "matkp_collaborate",
                    node: 684
                },
                about: {
                    title: "About MATKP",
                    page_id: "matkp_aboutproject",
                    node: 685
                },
                adipose: {
                    title: "About Adipose Tissue",
                    page_id: "matkp_aboutadipose",
                    node: 688
                }
            }
        };
    },

    watch: {
        keyParamsPage(newPage, oldPage) {
            if (newPage !== oldPage) {
                this.getContent(newPage)
            }
        },
    },

    computed: {
        keyParamsPage() {
            return keyParams.page;
        },
    },

    mounted() {
    },

    async created() {
        //await this.getConfig();
        await this.getContent(keyParams.page);
    },

    methods: {
        async getConfig() {
            const dataPoint =
                "https://hugeampkpncms.org/rest/data?pageid=matkp_config";
            const result = await fetch(dataPoint).then((resp) => resp.json());
            const json = JSON.parse(result[0]["field_data_points"]);
            this.config = json;
        },
        async getContent(pageLabel) {
            let byorPageId = this.pages[pageLabel]?.page_id || this.fallbackId;
            let allContent = await getTextContent(byorPageId);
            this.pageContent = allContent;
        }
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
