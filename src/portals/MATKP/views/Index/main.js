import Vue from "vue";
import Template from "./Template.vue";

import "../../assets/matkp-styles.css";

import { matkpMixin } from "../../mixins/matkpMixin.js";

import matkpHero from "@/portals/MATKP/components/matkp-hero.vue";
import matkpAnatomogram from "@/portals/MATKP/components/matkp-anatomogram.vue";
import { getNewsFeed } from "@/portals/MATKP/utils/content.js";

//import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
const BIO_INDEX_HOST = "https://bioindex-dev.hugeamp.org";

new Vue({
    components: {
        matkpHero,
        matkpAnatomogram,
    },
    mixins: [matkpMixin],

    data() {
        return {
            config: null,
            content:{
                collaborate: "MATKP is a growing resource that strives to create an inclusive community for adipose biology. As we develop MATKP, we welcome collaborations in areas including data collection and curation, method development, tool creation, and data visualization. We value input from data providers, experts, and multidisciplinary users to ensure the utility and relevance of our resource. To collaborate, please contact us at <a href='mailto:help@matkp.org'>help@matkp.org</a>.",

                news: {
                    feedId: "matkp",
                    newsUrl: "/info.html?page=news",
                    newsItemUrl: "/info.html?page=news&id=",
                },
            },
            newsFeed: null,
        };
    },

    watch: {},

    computed: {
    },

    mounted() {
    },

    async created() {
        await this.getConfig();
        await this.getNews();
    },

    methods: {
        async getConfig() {
            const dataPoint =
                "https://hugeampkpncms.org/rest/data?pageid=matkp_config";
            const result = await fetch(dataPoint).then((resp) => resp.json());
            const json = JSON.parse(result[0]["field_data_points"]);
            this.config = json;
            console.log("config", json);
        },
        async getNews() {
            this.newsFeed = await getNewsFeed(this.content.news.feedId);
        },
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
