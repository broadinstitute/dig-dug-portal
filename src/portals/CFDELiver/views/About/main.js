import Vue from "vue";
import Template from "./Template.vue";
import keyParams from "@/utils/keyParams";

import { contentMixin } from "@/portals/CFDELiver/mixins/contentMixin.js";
import { getTextContent } from "@/portals/CFDELiver/utils/content.js";

new Vue({
    mixins: [contentMixin],
    data() {
        return{
            pageContentAbout: null,
            pageContentGovernance: null
        }
    },
    watch: {},
    computed: {
        page(){
            return keyParams.page;
        }
    },
    mounted(){},
    async created(){
        if (keyParams.page === undefined){
            keyParams.set({page: 'about'});
        }
        await this.fetchInfo();
    },
    methods: {
        async fetchInfo() {
            const about = await getTextContent("cfdeliver_about", false, true);
            this.pageTitleAbout = about.title;
            this.pageContentAbout = about.body;
            const governance = await getTextContent("cfdeliver_governance", false, true);
            this.pageTitleGovernance = governance.title;
            this.pageContentGovernance = governance.body;
        },
    },
    render: (h) => h(Template),
}).$mount("#app");