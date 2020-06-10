<template>
    <div>
        <vue-typeahead-bootstrap
            v-model="userText"
            ref="tissueSelect"
            placeholder="Type in a tissue ..."
            :data="tissueOptions"
            :serializer="s => s.description"
            :showOnFocus="false"
            :minMatchingChars="0"
            @hit="onTissueSelected($event)">
        </vue-typeahead-bootstrap>
    </div>
</template>

<script>
import Vue from "vue";
import _ from "lodash";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);
Vue.component("vue-typeahead-bootstrap", VueTypeaheadBootstrap);

export default Vue.component("tissue-selectpicker", {
    props: {
        tissues: {
            type: Array,
            required: true,
        },
        clearOnSelected: {
            type: Boolean,
            required: false,
        },
        defaultTissue: {
            type: String,
            required: false,
        }
    },
    data() {
        return {
            userText: this.defaultTissue || null,
        };
    },
    computed: {
        tissueOptions() {
            if (!this.tissues) {
                return [];
            }

            return this.tissues.sort((a, b) => {
                if (a.group < b.group) return -1;
                if (b.group < a.group) return 1;

                if (a.description < b.description) return -1;
                if (b.description < a.description) return 1;

                return 0;
            });
        }
    },
    methods: {
        onTissueSelected(event) {
            this.$store.dispatch("onTissueChange", {
                tissue: event,
            });

            if (this.clearOnSelected) {
                this.userText = null;
            }
        },

        setFocus() {
            this.$nextTick(() => {
                this.$refs.tissueSelect.$refs.input.focus();
            });
        }
    }
});
</script>
