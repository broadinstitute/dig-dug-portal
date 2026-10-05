import Vue from "vue";
import Template from "./Template.vue";

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
    computed: {},
    mounted(){},
    async created(){
        await this.fetchInfo();
    },
    methods: {
        async fetchInfo() {
            const about = await getTextContent("cfdeliver_about", false, true);
            this.pageContentAbout = about;
            const governance = await getTextContent("cfdeliver_governance", false, true);
            this.pageContentGovernance = governance;
        },
    },
    render: (h) => h(Template),
}).$mount("#app");