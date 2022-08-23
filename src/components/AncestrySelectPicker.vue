<template>
    <select
        v-model="userText"
        ref="ancestrySelect"
        @change="onAncestrySelected(userText)"
    >
        <option value="" selected>Select an ancestry</option>
        <option v-for="ancestry in ancestryOptions" :value="ancestry">{{ ancestryFormatter(ancestry) }}</option>
    </select>
</template>

<script>
import Vue from "vue";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import Formatters from "@/utils/formatters";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);
Vue.component("vue-typeahead-bootstrap", VueTypeaheadBootstrap);

export default Vue.component("ancestry-selectpicker", {
    props: ["ancestries", "clearOnSelected", ],

    data() {
        return {
            userText: "",
            ancestryList : null
        };
    },
    computed: {
        ancestryOptions: function() {
            if (!this.ancestries) {
                return [];
            }
            let ancestryList = [];
            for (const ancestry of this.ancestries){
                if (!ancestryList.includes(ancestry)){
                    console.log(ancestry);
                    ancestryList.push(ancestry);
                }
            }
            return ancestryList.sort();
        },
    },
    methods: {
        ancestryFormatter: Formatters.ancestryFormatter,
        onAncestrySelected(userText) {
            this.$store.dispatch("onAncestryChange", userText);
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
