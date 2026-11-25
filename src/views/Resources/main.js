import { mountPage } from "@/utils/pageSetup";
import Template from "./Template.vue";
import store from "./store.js";
import Resources from "@/components/Resources.vue";
import keyParams from "@/utils/keyParams";
import { pageMixin } from "@/mixins/pageMixin.js";

// @vue/component
mountPage(Template, {
    store,
    components: {
        Resources,
    },
    mixins: [pageMixin],
    computed: {
        resources() {
            let contents = this.$store.state.kp4cd.resources;

            if (contents.length === 0) {
                return {};
            }
            return contents;
        },

        nid() {
            let content = keyParams.resource;
            return content;
        },
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
            this.$store.dispatch("kp4cd/getResources", group.name);
        },
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
    },
});
