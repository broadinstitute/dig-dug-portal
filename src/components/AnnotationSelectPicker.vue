<template>
    <vue-typeahead-bootstrap
        v-model="userText"
        ref="annotationOptionsSelect"
        placeholder="Add an annotation ..."
        :data="annotations"
        :serializer="(r) => snakeFormatter(r.annotation)"
        :showOnFocus="true"
        :minMatchingChars="0"
        :maxMatches="1000"
        @hit="onAnnotationSelect($event)"
    >
        <template slot="suggestion" slot-scope="{ data, htmlText }">
            <span v-html="htmlText"></span>&nbsp;
        </template>
    </vue-typeahead-bootstrap>
</template>

<script>
import Vue from "vue";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import Formatters from "@/utils/formatters";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);
Vue.component("vue-typeahead-bootstrap", VueTypeaheadBootstrap);

export default Vue.component("annotation-selectpicker", {
    props: {
        annotations: {
            type: Array,
            required: true,
        },
        clearOnSelected: {
            type: Boolean,
            required: false,
        },
        defaultSet: {
            type: String,
            required: false,
        },
    },
    data() {
        return {
            userText: this.defaultSet || null,
        };
    },
    methods: {
        ...Formatters,
        onAnnotationSelect(event) {
            this.$emit("annotation", event);

            if (this.clearOnSelected) {
                this.userText = "";
            }
        },

        setFocus() {
            this.$nextTick(() => {
                this.$refs.annotations.$refs.input.focus();
            });
        },
    },
});
</script>
