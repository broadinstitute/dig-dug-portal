<template> 
    <b-tooltip v-if="['subject', 'object'].includes(rowData.field.key)" :target="target">
        <a v-if="portalLinkFor(rowData.field.key, label) !== ''" :href="portalLinkFor(rowData.field.key, label)"  target="_blank">
            <span style="color: #fff">Go to Portal resource</span><br>
        </a>
        <resolved-curie-link
            class="options-4-actions"
            :curie="rowData.value">
            <span style="color: #fff">Go to curated entry</span>
        </resolved-curie-link>
    </b-tooltip>
</template>
<script>
import Vue from "vue";
import trapi from "@/components/NCATS/trapi"

export default Vue.component("results-tooltip", {
    props: ['rowData', 'target', 'curie', 'query_graph'],
    data() {
        return {
            label: null,
        }
    },
    async mounted() {
        let curie = !!this.curie ? this.curie : this.rowData.value;
        this.label = await trapi.normalize.curieLabel(curie);
    },
    methods: {
        portalLinkFor(subjectOrObject, label) {
            const portalLinkMappings = {
                'biolink:Gene': '/Gene.html?gene=',
                // TODO: Phenotype
            }

            // TODO: Assumes one-hop query
            const edgeSubjectOrObjectName = Object.entries(this.query_graph.edges)[0][1][subjectOrObject]
            const node = Object.entries(this.query_graph.nodes).filter(el => el[0] === edgeSubjectOrObjectName)[0][1]
            const category = node.category;

            if (!!portalLinkMappings[category]) {
                return `${portalLinkMappings[category]}${label}`;
            }
            return ''
        },
    }
})
</script>