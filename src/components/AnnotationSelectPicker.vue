<template>
    <vue-typeahead-bootstrap
        v-model="userText"
        ref="annotationOptionsSelect"
        placeholder="Add an annotation ..."
        :data="annotationOptions"
        :serializer="(r) => snakeFormatter(r.annotation)"
        :showOnFocus="true"
        :minMatchingChars="0"
        :maxMatches="1000"
        @hit="onAnnotationSelect($event)"
    >
        <template v-slot:suggestion="{ data, htmlText }">
            <span v-html="htmlText"></span>&nbsp;
        </template>
    </vue-typeahead-bootstrap>
</template>

<script>
import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import Formatters from "@/utils/formatters";

export default {
    name: "annotation-selectpicker",
    components: {
        VueTypeaheadBootstrap,
    },
    props: {
        annotations: {
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
        }
    },
    emits: ["annotation"],
    data() {
        return {
            userText: this.defaultSet || null
        };
    },
    computed: {
        annotationOptions() {
            return this.annotations.sort((a, b) => {
                if (a.annotation < b.annotation) return -1;
                if (b.annotation < a.annotation) return 1;
                return 0;
            });
        }
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
        }
    }
};
</script>
