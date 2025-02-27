import Vue from "vue";
import Template from "./Template.vue";

import "../../css/f-layout.css";
import "../../css/sysbio.css";

import { sysbioMixin } from "../../mixins/sysbioMixin.js";

import keyParams from "../../../../utils/keyParams.js";

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
        await this.getContent(keyParams.page);
    },

    methods: {
        async getContent(PAGE) {

            const CONTENT_URL = "https://hugeampkpncms.org/rest/byor_content?id=" + this.pages[PAGE];

            let jsonContent = await fetch(CONTENT_URL).then(
                resp => resp.json());
            if (jsonContent.length === 0) {
                this.pageContent = null;
            }

            this.pageContent = jsonContent[0];

            console.log("this.pageContent", this.pageContent);
        }
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
