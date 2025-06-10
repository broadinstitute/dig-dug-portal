import Vue from "vue";
import Template from "./Template.vue";

import "../../assets/matkp-styles.css";

import { matkpMixin } from "../../mixins/matkpMixin.js";

import matkpHero from "@/portals/MATKP/components/matkp-hero.vue";
import matkpAnatomogram from "@/portals/MATKP/components/matkp-anatomogram.vue";
import { getTextContent, getNewsFeed, getNewsItem } from "@/portals/MATKP/utils/content.js";
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
            pageType: null,
            pageContent: null,
            fallbackId: "matkp_help",
            pages: {
              news: { 
                title: "News", 
                page_id: "matkp", 
                node: 682,
                type: 'list'
              },
              help: {
                title: "Help",
                page_id: "matkp_help",
                node: 683,
                type: 'content'
              },
              collaborate: {
                title: "Collaborate with MATKP",
                page_id: "matkp_collaborate",
                node: 684,
                type: 'content'
              },
              about: {
                title: "About MATKP",
                page_id: "matkp_aboutproject",
                node: 685,
                type: 'content'
              },
              adipose: {
                title: "About Adipose Tissue",
                page_id: "matkp_aboutadipose",
                node: 688,
                type: 'content'
              },
              policies: {
                title: "Policies",
                page_id: "matkp_policies",
                node: 783,
                type: 'content'
              },
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
      keyParamsPage(){
        return keyParams.page;
      },
    },

    mounted() {
    },

    async created() {
        await this.getConfig();
        await this.getContent(keyParams.page);
    },

    methods: {
        async getConfig() {
            const dataPoint = "https://hugeampkpncms.org/rest/data?pageid=matkp_config";
            const result = await fetch(dataPoint).then((resp) => resp.json());
            const json = JSON.parse(result[0]["field_data_points"]);
            this.config = json;
        },
        async getContent(pageLabel){
          const page = this.pages[pageLabel];
          this.pageType = page?.type;
          if(this.pageType === 'content'){
            let byorPageId = page?.page_id || this.fallbackId;
            let allContent = await getTextContent(byorPageId, false, true);
            this.pageContent = allContent;
          }else if(this.pageType==='list'){
            const listItem = keyParams.id;
            console.log(listItem);
            if(listItem){
              this.pageContent = await getNewsItem(listItem);
            }else{
              this.pageContent = await getNewsFeed(page?.page_id);
            }
          }
          
        }
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
