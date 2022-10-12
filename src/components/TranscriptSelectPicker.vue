<template>
    <select class="form-control"
        v-model="$store.state.selectedTranscript"
        ref="transcriptSelect">
        <option value="" selected>Select a transcript</option>
        <option v-for="transcript in transcriptOptions" :value="transcript">{{ transcript }}</option>
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

export default Vue.component("transcript-selectpicker", {
    props: ["transcripts"],

    data() {
        return {
            userText: ""
        };
    },
    computed: {
        transcriptOptions: function() {
            return !this.transcripts ? [] : this.transcripts;
        },
    },
    methods: {
        setFocus() {
            this.$nextTick(() => {
                this.$refs.transcriptSelect.$refs.input.focus();
            });
        },
    },
});
</script>
