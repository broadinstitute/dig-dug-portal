<template>
    <vue-typeahead-bootstrap
        v-model="userText"
        ref="annotationOptionsSelect"
        placeholder="Add an annotation ..."
        :data="annotationOptions"
        :serializer="s => `${!!s.tissue ? s.tissue : ''} ${s.annotation}`"
        :showOnFocus="true"
        :minMatchingChars="0"
        :maxMatches="1000"
        @hit="onAnnotationSelect($event)"
    >
        <template slot="suggestion" slot-scope="{ data, htmlText }">
            <span v-html="htmlText"></span>&nbsp;
            <small class="text-secondary">
                {{ !!data.method ? data.method : '' }}<br>
                P-Value: {{ !!data.pValue ? pValueFormatter(data.pValue) : '' }}<br>
                Fold: {{ !!data.expectedSNPs && !!data.SNPs ?  floatFormatter(data.SNPs / data.expectedSNPs, 1) : '' }}<br>
            </small>
        </template>
    </vue-typeahead-bootstrap>
</template>

<script>
import Vue from "vue";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import Formatters from "@/utils/formatters"

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
        },
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
            } else {
                let annotations = this.annotations;
                return annotations.sort((a, b) => {
                    if (a.annotation < b.annotation) return -1;
                    if (b.annotation < a.annotation) return 1;

                    if (!!a.method && !!b.method) {
                        if (a.method < b.method) return -1;
                        if (b.method < a.method) return 1;
                    }

                    if (!!a.count && !!b.count) {
                        if (a.count < b.count) return -1;
                        if (b.count < a.count) return 1;
                    }

                    return 0;
                });
            }


        }
    },
    methods: {
        pValueFormatter: Formatters.pValueFormatter,
        floatFormatter: Formatters.floatFormatter,
        onAnnotationSelect(event) {
            this.$emit("annotation", event);

            if (this.clearOnSelected) {
                this.userText = '';
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
