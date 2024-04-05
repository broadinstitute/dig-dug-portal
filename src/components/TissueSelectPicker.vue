<template>
    <vue-typeahead-bootstrap
        v-model="userText"
        ref="tissueOptionsSelect"
        placeholder="Add a tissue..."
        :data="tissueOptions"
        :serializer="(r) => capitalizedFormatter(r.tissue)"
        :showOnFocus="true"
        :minMatchingChars="0"
        :maxMatches="1000"
        @hit="onTissueSelect($event)"
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
import { request } from "@/utils/bioIndexUtils";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);
Vue.component("vue-typeahead-bootstrap", VueTypeaheadBootstrap);

export default Vue.component("tissue-selectpicker", {
    props: {
        tissues: {
            type: Array,
            required: false
        },
        clearOnSelected: {
            type: Boolean,
            required: false
        },
        defaultSet: {
            type: String,
            required: false
        }
    },
    data() {
        return {
            userText: this.defaultSet || null,
            tissueBox : !!this.tissues? this.tissues : []
        };
    },
    mounted: async function(){
        if (!!this.tissues){ return;}
        let url = "api/bio/keys/partitioned-heritability-top-tissue/2";
        request(url, {columns: 'tissue'})
            .then(resp => {
                if (resp.status === 200){
                    return resp.json();
                }
            }).then(json => {
                if (!!json){
                    let tissues = json.keys.flat().map(t => {return {tissue: t};});
                    console.log(JSON.stringify(tissues));
                    this.tissueBox = tissues;
                } else {
                    console.error("Tissues not available.");
                }
            });
    },
    computed: {
        tissueOptions() {
            return this.tissueBox.sort((a, b) => {
                if (a.tissue < b.tissue) return -1;
                if (b.tissue < a.tissue) return 1;
                return 0;
            });
        }
    },
    methods: {
        ...Formatters,

        onTissueSelect(event) {
            this.$emit("tissue", event);

            if (this.clearOnSelected) {
                this.userText = "";
            }
        },

        setFocus() {
            this.$nextTick(() => {
                this.$refs.tissueOptions.$refs.input.focus();
            });
        }
    }
});
</script>
