import Vue from "vue";
import Template from "./Template.vue";

import { contentMixin } from "@/portals/CFDELiver/mixins/contentMixin.js";
import { getTextContent } from "@/portals/CFDELiver/utils/content.js";

new Vue({
    mixins: [contentMixin],
    data() {
        return{
            pageContent: null,
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
            const res = await getTextContent("cfdeliver_home", false, true);
            const clean = JSON.parse(res.field_data_table_format);
            this.pageContent = clean;
        },
    },
    render: (h) => h(Template),
}).$mount("#app");