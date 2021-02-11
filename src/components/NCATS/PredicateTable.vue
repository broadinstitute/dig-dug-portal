<template>
    <b-card
        class="mb-2">
        <b-row no-gutters>
            <b-card-body :title="title">
            </b-card-body>
            <b-pagination
                v-model="currentPage"
                :total-rows="geneInfo.length"
                :per-page="perPage"
                :aria-controls="id"
            ></b-pagination>
            <b-table
                v-if="context"
                :id="id"
                :items="geneInfo"
                :per-page="perPage"
                :current-page="currentPage"
                small>

                <!-- Custom rendering for known special cases -->
                <template #cell(id)="data">
                    <div v-if="typeof context[supportedPrefix(data.item.source, context)] !== 'undefined'">
                        <resolved-curie-link
                            :id="data.item.id"
                            :prefix="supportedPrefix(data.item.source, context)"
                        ></resolved-curie-link>
                    </div>
                    <div v-else>
                        <resolved-curie-link
                            :curie="data.item.id">
                        </resolved-curie-link>
                    </div>
                </template>

                <template #cell(pubmed)="data">
                    <resolved-curie-link
                        v-for="pmid in [].concat(data.item.pubmed)"
                        :key="pmid"
                        :prefix="'pmid'"
                        :id="pmid">
                    </resolved-curie-link>
                </template>

            </b-table>
        </b-row>
    </b-card>
</template>
<script>
import Vue from "vue";
import jsonQuery from "json-query";
import queryString from "query-string";
import ResolvedCurie from "@/components/NCATS/ResolvedCurieLink"
import trapi from "./trapi"

const myGeneAPI = 'https://mygene.info/v3';

export default Vue.component("ncats-predicate-table", {
    props: ["title", "geneSymbol", "field", "filter"],
    component: {
        ResolvedCurie
    },
    data() {
        return {
            id: this.geneSymbol+this.fields+this.title,
            currentPage: 1,
            perPage: 10,
            rawGeneInfo: [],
            myFilter: id => true,
            context: null,
        }
    },
    async created() {
        this.context = await fetch('https://raw.githubusercontent.com/biolink/biolink-model/master/context.jsonld')
            .then(response => response.json())
            .then(json => json['@context'])

        let qs = queryString.stringify({
            q: this.geneSymbol,
            fields: this.field,
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
            .then(json => { this.rawGeneInfo = json; })
            .catch(error => console.error(error));
    },
    computed: {
        geneInfo() {
            return this.geneInfoForField(this.rawGeneInfo, this.field).filter(this.myFilter);
        }
    },
    methods: {
        supportedPrefix: trapi.supportedPrefix,
        remap(prefix) {
            const remapping = {
                'reactome': 'REACT',
                'wikipathways': 'WIKIPATHWAYS'
            }
            if (!!remapping[prefix]) {
                return remapping[prefix];
            }
            return prefix;
        },
        geneInfoForField(geneInfo, field) {
            const helpers = {
                aggregateNestedLists: function(elements) {
                    const element = elements
                        .flatMap(element =>
                        Object.entries(element)
                            .filter(element => element[1].length > 0)
                            .flatMap(thisEntry =>
                                thisEntry[1].map(entry => { entry['source'] = thisEntry[0]; return entry })))
                    console.log(element)
                    return element;
                },
            }
            return jsonQuery(`geneInfo[${field}]:aggregateNestedLists`, {
                data: {
                    geneInfo
                },
                allowRegexp: true,
                locals: helpers
            }).value;
        },
    },
    watch: {
        geneSymbol() {
            let qs = queryString.stringify({
                q: this.geneSymbol,
                fields: this.field,
            }, { arrayFormat: 'comma' });
            fetch(`${myGeneAPI}/query?${qs}`, { contentType: "application/json" })
                .then(async resp => {
                    if (resp.status === 200) {
                        const geneSymbolMatches = await resp.json();
                        return geneSymbolMatches.hits;
                    } else {
                        throw new Error(`MyGene Info returning non-successful code ${resp.status}`);
                    }
                })
                .then(json => { this.rawGeneInfo = json; })
                .catch(error => console.error(error));
        }
    }
});
</script>
