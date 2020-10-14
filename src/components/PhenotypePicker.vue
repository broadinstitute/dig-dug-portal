<template>
    <div v-if="multipleselect==false">
        <vue-typeahead-bootstrap
            v-model="userText"
            ref="phenotypeSelect"
            placeholder="Type in a phenotype ..."
            :data="phenotypeOptions"
            :serializer="s => s.description"
            :maxMatches="1000"
            :minMatchingChars="0"
            :showOnFocus="true"
            @hit="onPhenotypeSelected($event)"
        >
            <template slot="suggestion" slot-scope="{ data, htmlText }">
                <span v-html="htmlText"></span>&nbsp;
                <small class="text-secondary">{{ data.group }}</small>
            </template>
        </vue-typeahead-bootstrap>
    </div>

    <div v-else-if="multipleselect == true">
        <multiselect
            v-model="userText"
            tag-placeholder="Add this as new tag"
            placeholder="Search or add a tag"
            label="description"
            track-by="name"
            :options="phenotypeOptions"
            :multiple="true"
            :taggable="true"
            @tag="addTag"
            @select="onSecondaryPhenotypeSelected($event)"
        ></multiselect>
        <template slot="suggestion" slot-scope="{ data, htmlText }">
            <span v-html="htmlText"></span>&nbsp;
            <small class="text-secondary">{{ options.name }}</small>
        </template>
    </div>
</template>

<script>
import Vue from "vue";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import Multiselect from "vue-multiselect";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);
Vue.component("vue-typeahead-bootstrap", VueTypeaheadBootstrap);
Vue.component("multiselect", Multiselect);

export default Vue.component("phenotype-picker", {
    props: {
        phenotypes: {
            type: Array,
            required: true
        },
        clearOnSelected: {
            type: Boolean,
            required: false
        },
        defaultSet: {
            type: String,
            required: false
        },
        multipleselect: {
            type: Boolean,
            required: false,
            default: false
        }
    },

    data() {
        return {
            userText: this.defaultPhenotype || null
        };
    },
    computed: {
        phenotypeOptions() {
            if (!this.phenotypes) {
                return [];
            }
            return this.phenotypes.sort((a, b) => {
                if (a.group < b.group) return -1;
                if (b.group < a.group) return 1;

                if (a.description < b.description) return -1;
                if (b.description < a.description) return 1;
                return 0;
            });
        }
    },
    methods: {
        onPhenotypeSelected(event) {
            this.$emit("phenotypeAssociationGeneData", event);

            if (this.clearOnSelected) {
                this.userText = "";
            }
        },
        onSecondaryPhenotypeSelected(event) {
            this.$emit("secphenotypeAssociationGeneData", event);

            if (this.clearOnSelected) {
                this.userText = "";
            }
        },
        setFocus() {
            this.$nextTick(() => {
                this.$refs.phenotypeSelect.$refs.input.focus();
            });
        },

        addTag(newTag) {
            const tag = {
                name: newTag,
                code:
                    newTag.substring(0, 2) +
                    Math.floor(Math.random() * 10000000)
            };
            this.options.push(tag);
            this.value.push(tag);
        }
    }
});
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>