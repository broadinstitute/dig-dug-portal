import Vue from "vue";
import Template from "./Template.vue";

import { contentMixin } from "@/portals/CFDELiver/mixins/contentMixin.js";
import { getContent } from "@/portals/CFDELiver/utils/content.js";

new Vue({
    mixins: [contentMixin],
    data() {
        return{
            
        }
    },
    watch: {},
    computed: {},
    mounted(){},
    created(){},
    methods: {

    },
    render: (h) => h(Template),
}).$mount("#app");