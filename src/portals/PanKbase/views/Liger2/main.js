import { mountPage } from "@/utils/pageSetup";
import Template from "./Template.vue";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";

// @vue/component
mountPage(Template, {
    mixins: [pankbaseMixin],

    data() {
        return {
            ligerApiOverrides: {}
        };
    },
});
