import Vue from "vue";
import Template from "./Template.vue";

import "../../css/f-layout.css";
import "../../css/sysbio.css";

import { sysbioMixin } from "../../mixins/sysbioMixin.js";

import keyParams from "../../../../utils/keyParams.js";
import dataConvert from "../../../../utils/dataConvert.js";
import { getTextContent } from "@/portals/SysBio/utils/content.js";

// Use keyparams to do this

new Vue({

    mixins: [sysbioMixin],

    data() {
        return {
            pageContent: {},
            fallbackId: "sysBio_help",
            pages: {
                contact: "sysbiofairplex_contact",
                collaborate: "sysbiofairplex_collaborate",
                team: "sysbiofairplex_people",
                policies: "sysbiofairplex_policies",
                about: "sysbiofairplex_aboutus",
                access: "sysbiofairplex_howtoaccessampdatadirectly",
                glossary: "sysbiofairplex_glossary",
                ampdata: "sysbiofairplex_ampdata",
                harmonization: "sysbiofairplex_dataharmonization",
                feedback: "sysbiofairplex_sharefeedback"
            }
        };
    },

    watch: {
        async keyParamsPage(newPage, oldPage) {
            if (newPage !== oldPage) {
                await this.getContent(newPage)
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
        if (!!keyParams.page){
            await this.getContent(keyParams.page);
        }
    },

    methods: {
        ...dataConvert,
        csv2Json(DATA) {
            return dataConvert.csv2Json(DATA);
        },
        async getContent(page){
            console.log("Is this thing on?");
            let byorPage = this.pages[page];
            let pageContent = await getTextContent(byorPage, false, true);
            this.pageContent = pageContent;
        }
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
