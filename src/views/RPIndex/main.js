import { mountPage } from "@/utils/pageSetup";

import Template from "./Template.vue";
import store from "./store.js";

import ResearchByorProjects from "@/components/researchPortal/ResearchByorProjects.vue";


// @vue/component
mountPage(Template, {
    store,

    data: () => ({

    }),

    components: {
        ResearchByorProjects,
    },

    created() {

    },

    methods: {

    },

    computed: {

    },

    watch: {

    }
});
