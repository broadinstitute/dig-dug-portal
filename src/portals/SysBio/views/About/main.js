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
                access: "sysbiofairplex_howtoaccessampdatadirectly"
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
        this.pageContent = await getTextContent(this.pages[keyParams.page], true);
    },

    methods: {
        ...dataConvert,
        csv2Json(DATA) {
            return dataConvert.csv2Json(DATA);
        },
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
