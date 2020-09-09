<template>
    <vue-typeahead-bootstrap
        v-model="userText"
        ref="credibleSetSelect"
        placeholder="Add a credible set ..."
        :data="credibleSetsOptions"
        :serializer="s => s.credibleSetId"
        :showOnFocus="true"
        :minMatchingChars="0"
        :maxMatches="30"
        @hit="onCredibleSetSelected($event)">
        <template slot="suggestion" slot-scope="{ data, htmlText }">
            <span v-html="htmlText"></span>&nbsp;
            <small class="text-secondary">
                {{ data.credibleSetId === 'computed' ? 'from current associations' : `${data.dataset}` }}
            </small>
        </template>
    </vue-typeahead-bootstrap>

</template>

<script>
import Vue from "vue";
import _ from "lodash";

import EventBus from "@/utils/eventBus";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);
Vue.component("vue-typeahead-bootstrap", VueTypeaheadBootstrap);

export default Vue.component("credible-sets-selectpicker", {
    props: {
        credibleSets: {
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
        credibleSetsOptions() {
            if (!this.credibleSets) {
                return [];
            }
            this.credibleSets.sort((a, b) => {
                if (a.credibleSetId < b.credibleSetId) return -1;
                if (b.credibleSetId < a.credibleSetId) return 1;
                return 0;
            });
            this.credibleSets.unshift({
                credibleSetId: 'computed',
            })
            return this.credibleSets;
        }
    },
    methods: {
        onCredibleSetSelected(event) {
            this.$emit("credibleset", event);
            if (this.clearOnSelected) {
                this.userText = '';
            }
        },
        setFocus() {
            this.$nextTick(() => {
                this.$refs.credibleSetsOptions.$refs.input.focus();
            });
        }
    }
});
</script>
