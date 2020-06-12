<template>
    <vue-typeahead-bootstrap
        v-model="userText"
        ref="annotationOptionsSelect"
        placeholder="Select an annotation ..."
        :data="annotationOptions"
        :serializer="s => s.annotation"
        :showOnFocus="true"
        :minMatchingChars="0"
        @hit="onAnnotationSelect($event)"
    >
        <template slot="suggestion" slot-scope="{ data, htmlText }">
            <span v-html="htmlText"></span>&nbsp;
            <small class="text-secondary">{{ !!data.method ? data.method : '' }}</small>
        </template>
    </vue-typeahead-bootstrap>
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

export default Vue.component("annotation-method-selectpicker", {
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
        }
    },
    data() {
        return {
            userText: this.defaultSet || null
        };
    },
    computed: {
        annotationOptions() {
            if (!this.annotations) {
                return [];
            }

            return this.annotations.sort((a, b) => {
                if (a.annotation < b.annotation) return -1;
                if (b.annotation < a.annotation) return 1;

                if (!!a.method && !!b.method) {
                    if (a.method < b.method) return -1;
                    if (b.method < a.method) return 1;
                }

                return 0;
            });
        }
    },
    methods: {
        onAnnotationSelect(event) {
            this.$store.dispatch("onAnnotationChange", event);

            if (this.clearOnSelected) {
                this.userText = null;
            }
        },

        setFocus() {
            this.$nextTick(() => {
                this.$refs.annotationOptions.$refs.input.focus();
            });
        }
    }
});
</script>
