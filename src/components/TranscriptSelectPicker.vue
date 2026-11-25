<template>
    <select class="form-control"
        v-model="$store.state.selectedTranscript"
        ref="transcriptSelect" @click="this.disablePlaceholder">
        <option value="">{{ $store.state.geneName.toUpperCase()}}</option>
        <option v-for="transcript in transcriptOptions" :value="transcript">{{ transcript }}</option>
    </select>
</template>

<script>
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import Formatters from "@/utils/formatters";

export default {
    name: "transcript-selectpicker",
    props: ["transcripts"],

    data() {
        return {
            userText: ""
        };
    },
    computed: {
        transcriptOptions: function() {
            return !this.transcripts ? [] 
                : this.transcripts.filter((transcript) => transcript["CCDS"]).map((transcript) => transcript["transcript_id"]);
        },
    },
    methods: {
        pValueFormatter: Formatters.pValueFormatter,
        setFocus() {
            this.$nextTick(() => {
                this.$refs.transcriptSelect.$refs.input.focus();
            });
        },
        disablePlaceholder(){
            let placeholder = document.getElementById("transcript-placeholder");
            placeholder.disabled = true;
        }
    },
};
</script>
