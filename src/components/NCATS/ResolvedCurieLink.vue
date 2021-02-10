<template>
    <a v-if="this.context && this.resolvedCurie" :href="resolvedCurie"  target="_blank" rel="noopener noreferrer">
        {{deserializedCurie[0]+':'+deserializedCurie[1]}}
    </a>
    <span v-else>
        {{!!this.curie ? this.curie :
            !!this.id ? this.id : null}}
    </span>
</template>
<script>
import Vue from "vue";

export default Vue.component('resolved-curie-link', {
    props: ["curie", "prefix", "id"],
    data() {
        return {
            context: null,
        }
    },
    async mounted() {
        this.context = await fetch('https://raw.githubusercontent.com/biolink/biolink-model/master/context.jsonld')
            .then(response => response.json())
            .then(json => json['@context'])
            .then(context => {
                // we want to
                let _context = { ...context };
                Object.keys(context).forEach(key => {
                    _context[key.toLowerCase()] = context[key];
                });
                return _context;
            });
    },
    computed: {
        deserializedCurie() {
            if (!!this.prefix && !!this.id) {
                return [this.prefix, this.id];
            } else if (!!this.curie && this.curie.split(":").length > 1) {
                return [...this.curie.split(":")];
            }
        },
        resolvedCurie() {
            if (!!this.deserializedCurie) {
                const [prefix, id] = this.deserializedCurie;
                if(this.context) return `${this.context[prefix]}${id}`;
            }
        }
    }
})
</script>
