<template>
    <input
        v-model="userText"
        ref="ancestrySelect"
        :placeholder="placeholder || 'Type in an ancestry ...'"
        @change="onAncestrySelected($event)"
    />
</template>

<script>
import Vue from "vue";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);
Vue.component("vue-typeahead-bootstrap", VueTypeaheadBootstrap);

export default Vue.component("ancestry-selectpicker", {
    props: ["ancestries", "clearOnSelected", "defaultAncestry", "placeholder"],

    data() {
        return {
            userText: this.defaultAncestry || "",
        };
    },
    computed: {
        ancestryOptions() {
            console.log("Ancestries: ");
            console.log(this.ancestries);
            if (!this.ancestries) {
                return [];
            }

            return this.ancestries.sort((a, b) => {
                if (a.group < b.group) return -1;
                if (b.group < a.group) return 1;

                if (a.description < b.description) return -1;
                if (b.description < a.description) return 1;

                return 0;
            });
        },
    },
    methods: {
        onAncestrySelected(event) {
            this.$store.dispatch("onAncestryChange", event);

            if (this.clearOnSelected) {
                this.userText = "";
                this.$refs.ancestrySelect.inputValue = "";
            }
        },

        setFocus() {
            this.$nextTick(() => {
                this.$refs.ancestrySelect.$refs.input.focus();
            });
        },
    },
});
</script>
