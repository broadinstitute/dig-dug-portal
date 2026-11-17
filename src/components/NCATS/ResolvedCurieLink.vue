<template>
    <a v-if="!!resolvedCurie" :href="resolvedCurie"  target="_blank" rel="noopener noreferrer" :title="curie">
        <slot>
            <curie-label 
                v-if="!!fullCurie"
                :curie="fullCurie"
                :keepTitlePrefix="keepTitlePrefix">
            </curie-label>
        </slot>
    </a>
    <span v-else>
        {{curie}}
    </span>
</template>
<script>
import Vue from "vue";
import trapi from "./trapi"
import NormalizedCurieLabel from "./NormalizedCurieLabel"

export default Vue.component('resolved-curie-link', {
    props: ["curie", "id", "prefix", "keepTitlePrefix"],
    components: {
        NormalizedCurieLabel
    },
    data() {
        return {
            context: null,
        }
    },
    async created() {
        this.context = await trapi.identifiers.context;
    },
    computed: {
        supportedPrefix() {
            if (this.context) return trapi.identifiers.supportedPrefix(this.prefix, this.context, { 'reactome': 'REACT' });
        },
        fullCurie() {
            const prefix = this.supportedPrefix || this.prefix;
            const id = trapi.identifiers.deserializeCurie(this.curie)[1] || this.id;
            if (!!prefix && !!id) {
                return trapi.identifiers.serializeCurie(prefix, id);
            } else if (!!this.curie) {
                return this.curie;
            }
        },
        deserializedCurie() {
            if (this.context) return trapi.identifiers.deserializeCurie(this.fullCurie);
        },
        resolvedCurie() {
            if (this.context) return trapi.identifiers.resolveCurie(this.fullCurie, this.context)
        }
    }
})
</script>
