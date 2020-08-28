<template>
    <vue-typeahead-bootstrap
        v-model="userText"
        ref="datasetSelect"
        placeholder="Type in a dataset name ..."
        :data="datasetOptions"
        :serializer="s => s.description"
        :maxMatches="1000"
        :minMatchingChars="0"
        :showOnFocus="true"
        @hit="onDatasetSelected($event)"
    ></vue-typeahead-bootstrap>
</template>

<script>
import Vue from "vue";

export default Vue.component("dataset-selectpicker", {
    props: ["datasets"],

    data() {
        return {
            userText: null,
        };
    },
    computed: {
        datasetOptions() {
            if (!this.datasets) {
                return [];
            }

            return this.datasets.sort((a, b) => {
                if (a.description < b.description) return -1;
                if (b.description < a.description) return 1;

                return 0;
            });
        },
    },
    methods: {
        onDatasetSelected(event) {
            this.$store.dispatch("onDatasetChange", event);

            if (this.clearOnSelected) {
                this.userText = null;
            }
        },

        setFocus() {
            this.$nextTick(() => {
                this.$refs.datasetSelect.$refs.input.focus();
            });
        },
    },
});
</script>
