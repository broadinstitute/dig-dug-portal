<template>
    <a v-if="!!resolvedCurie" :href="resolvedCurie"  target="_blank" rel="noopener noreferrer">
        {{fullCurie}}
    </a>
    <span v-else>
        {{!!curie ? curie :
            !!id ? id : null}}
    </span>
</template>
<script>
import Vue from "vue";
import trapi from "./trapi"

export default Vue.component('resolved-curie-link', {
    props: ["curie", "prefix", "id"],
    data() {
        return {
            context: null,
        }
    },
    async created() {
        this.context = await trapi.getContext();
    },
    computed: {
        supportedPrefix() {
            return trapi.supportedPrefix(this.prefix, this.context, { 'reactome': 'REACT' });
        },
        fullCurie() {
            if (!!this.supportedPrefix && !!this.id) {
                return trapi.serializeCurie(this.supportedPrefix, this.id);
            } else if (!!this.curie) {
                return this.curie;
            }
        },
        deserializedCurie() {
            if (this.context) return trapi.deserializeCurie(this.fullCurie);
        },
        resolvedCurie() {
            console.log(trapi.resolveCurie(this.fullCurie, this.context))
            if (this.context) return trapi.resolveCurie(this.fullCurie, this.context)
        }
    }
})
</script>
