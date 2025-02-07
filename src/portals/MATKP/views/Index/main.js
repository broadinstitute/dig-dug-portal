import Vue from "vue";
import Template from "./Template.vue";

import "../../assets/matkp-styles.css";

import { matkpMixin } from "../../mixins/matkpMixin.js";

import matkpHero from "@/portals/MATKP/components/matkp-hero.vue";
import matkpAnatomogram from "@/portals/MATKP/components/matkp-anatomogram.vue";

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
                    feedUrl:
                        "https://hugeampkpncms.org/rest/news_list?project=matkp",
                    newsUrl: "/news.html",
                    newsItemUrl: "/news.html?id=",
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
            const newsFeedUrl = this.content.news.feedUrl;
            const newsFeed = await fetch(newsFeedUrl).then((resp) => {
                return resp.json();
            });
            console.log({newsFeed});
            //trim feed to 5 items
            if (newsFeed.length > 5) newsFeed.length = 5;
            newsFeed.forEach((item) => {
                //extract only the img element frforom thumbnail, wysiwyg html can be polluted sometimes
                item.field_thumbnail_image =
                    new DOMParser()
                        .parseFromString(
                            item.field_thumbnail_image,
                            "text/html"
                        )
                        .querySelector("img")?.outerHTML || "";
            });
            this.newsFeed = newsFeed;
        },
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
