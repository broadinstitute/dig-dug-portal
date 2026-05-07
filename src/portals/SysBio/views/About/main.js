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
            prefix: "sysbiofairplex_",
            pages: {
                contact: "contact",
                collaborate: "collaborate",
                team: "people",
                policies: "policies",
                about: "aboutus",
                access: "howtoaccessampdatadirectly",
                glossary: "glossary",
                ampdata: "ampdata",
                harmonization: "harmonization",
                feedback: "sharefeedback",
                datasets: "datasets"
            },
            showDataPoints: {
                glossary: true,
                ampdata: true,
                team: true
            },
            membershipLeadingSpace: " Membership",
            dataPoints: [],
            teamSections: [],
            fallbackMembership: "FAIRplex Team"
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
        showData(){
            return this.showDataPoints[this.keyParamsPage] || false;
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
        async getContent(page){
            let byorPage = `${this.prefix}${this.pages[page]}`;
            let pageContent = await getTextContent(byorPage, false, true);
            this.pageContent = pageContent;
            if (!!pageContent.field_data_points){
                let dataPoints = dataConvert.csv2Json(pageContent.field_data_points);
                let sections = Array.from(new Set (dataPoints.map(
                    d => !!d[this.membershipLeadingSpace] ? d[this.membershipLeadingSpace] : d.Membership)));
                sections = sections.filter(d => d !== undefined);
                if (sections.length > 0){
                    dataPoints.forEach(d => {
                        let membership = !!d[this.membershipLeadingSpace] ? d[this.membershipLeadingSpace] : d.Membership;
                        if (membership === undefined){
                            membership = this.fallbackMembership;
                        }
                        d.Membership = membership.trim();
                        delete d[this.membershipLeadingSpace];
                    });
                    this.teamSections = sections.map(s => s.trim());
                }
                this.dataPoints = dataPoints;
            }
        },
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
