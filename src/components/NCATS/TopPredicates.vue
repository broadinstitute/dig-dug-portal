<template>
    <b-card
        class="mb-2">
        <b-row no-gutters>
            <b-card-body
                title="Pathways">
            </b-card-body>
        </b-row>
    </b-card>
</template>
<script>
import Vue from "vue";
export default Vue.component("ncats-predicate-table", {
    props: ["title", "geneSymbol", "fields"],
    data() {
        return {
            id: this.geneSymbol+this.fields+this.title,
            currentPage: 1,
            perPage: 5,
            geneInfo: [],
        }
    },
    async created() {
        let qs = queryString.stringify({
            q: this.geneSymbol,
            fields: this.fields,
        }, { arrayFormat: 'comma' });
        await fetch(`${myGeneAPI}/query?${qs}`, { contentType: "application/json" })
            .then(async resp => {
                if (resp.status === 200) {
                    const geneSymbolMatches = await resp.json();
                    return geneSymbolMatches.hits;
                } else {
                    throw new Error(`MyGene Info returning non-successful code ${resp.status}`);
                }
            })
            .then(json => { this.geneInfoData = json; })
            .catch(error => console.error(error));
    }
});
</script>
