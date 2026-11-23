import { mountPage } from "@/utils/pageSetup";
import Template from "./Template.vue";
import store from "./store.js";

import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert,
} from "@/components/Alert";

// @vue/component
mountPage(Template, {
    store,

    components: {
    },

    data: () => ({

    }),

    computed: {

    },

    watch: {

    },

    created() {

    },

    methods: {

    },
});
