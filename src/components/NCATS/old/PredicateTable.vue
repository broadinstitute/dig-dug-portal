<template>
    <b-row no-gutters>
        <b-card-body :title="title">
            <div class="eglt-table-wrapper">
                <div class="filtering-ui-wrapper container-fluid">
                    <div class="row filtering-ui-content">
                        <div class="col filter-col-md">
                            <div class="label">Search</div>
                            <input
                                v-model="filterString"
                                class="col filter-col-md form-control"
                                debounce="500"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div class="text-right mt-2 mb-2">
                <data-download
                    :data="geneInfo"
                    :filename="title"
                ></data-download>
            </div>
            <b-table
                v-if="context"
                :id="id"
                :items="geneInfo"
                :fields="tableFields"
                :per-page="perPage"
                :current-page="currentPage"
                :filter="filterString"
                small
                @filtered="onFiltered"
            >
                <!-- Custom rendering for known special cases -->
                <template #cell(id)="data">
                    <div
                        v-if="
                            typeof context[
                                supportedPrefix(data.item.source, context)
                            ] !== 'undefined'
                        "
                        :key="data.item.id"
                    >
                        <resolved-curie-link
                            :id="data.item.id"
                            :prefix="supportedPrefix(data.item.source, context)"
                        ></resolved-curie-link>
                    </div>
                    <div v-else :key="data.item.id">
                        <resolved-curie-link :curie="`${data.item.id}`">
                        </resolved-curie-link>
                    </div>
                </template>

                <template #cell(pubmed)="data">
                    <div v-for="pmid in getPubmedArray(data.item)">
                        <resolved-curie-link :id="pmid" :prefix="'pmid'"
                        :keepTitlePrefix="true">
                        </resolved-curie-link>
                    </div>
                </template>
            </b-table>

            <b-pagination
                v-model="currentPage"
                :total-rows="totalRows"
                :per-page="perPage"
                :aria-controls="id"
                size="sm"
            ></b-pagination>
        </b-card-body>
    </b-row>
</template>
<script>
import Vue from "vue";
import jsonQuery from "json-query";
import queryString from "query-string";
import ResolvedCurie from "@/components/NCATS/ResolvedCurieLink";
import trapi from "@/components/NCATS/trapi";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import DataDownload from "@/components/DataDownload";

const myGeneAPI = "https://mygene.info/v3";

export default Vue.component("TranslatorPredicateTable", {
    props: ["title", "geneSymbol", "field", "filter"],
    component: {
        ResolvedCurie,
        CriterionFunctionGroup,
        FilterEnumeration,
        DataDownload,
    },
    data() {
        return {
            id: this.geneSymbol + this.field + this.title,
            currentPage: 1,
            perPage: 10,
            rawGeneInfo: [],
            myFilter: (id) => true,
            context: null,
            filterString: "",
            totalRows: 0,
        };
    },
    computed: {
        geneInfo() {
            return this.geneInfoForField(this.rawGeneInfo, this.field).filter(
                this.myFilter
            );
        },
        fields() {
            return (
                Array.from(
                    new Set(
                        this.geneInfo.reduce(
                            (acc, item) => acc.concat(...Object.keys(item)),
                            []
                        )
                    )
                )
                    .sort((a, b) => {
                        const sortMap = { id: 0, source: 1 };
                        if (a === "id") {
                            return -1;
                        } else if (b === "id") {
                            return 1;
                        }
                    })
                    .filter(
                        (el) =>
                            !["evidence", "gocategory", "category"].includes(el)
                    ) || []
            );
        },
        tableFields() {
            return this.fields.map((key) => ({
                key,
                sortable: true,
                formatter: this.formatCell,
                filterByFormatted: true,
            }));
        },
    },
    watch: {
        geneSymbol() {
            let qs = queryString.stringify(
                {
                    q: this.geneSymbol,
                    fields: this.field,
                },
                { arrayFormat: "comma" }
            );

            fetch(`${myGeneAPI}/query?${qs}`, {
                contentType: "application/json",
            })
                .then(async (resp) => {
                    if (resp.status === 200) {
                        const geneSymbolMatches = await resp.json();
                        return geneSymbolMatches.hits;
                    } else {
                        throw new Error(
                            `MyGene Info returning non-successful code ${resp.status}`
                        );
                    }
                })
                .then((json) => {
                    this.rawGeneInfo = json;
                })
                .catch((error) => console.error(error));
        },
    },
    async created() {
        this.context = await fetch(
            "https://raw.githubusercontent.com/biolink/biolink-model/master/project/jsonld/biolink_model.context.jsonld"
        )
            .then((response) => response.json())
            .then((json) => json["@context"]);

        let qs = queryString.stringify(
            {
                q: this.geneSymbol,
                fields: this.field,
            },
            { arrayFormat: "comma" }
        );
        

        await fetch(`${myGeneAPI}/query?${qs}`, {
            contentType: "application/json",
        })
            .then(async (resp) => {
                if (resp.status === 200) {
                    const geneSymbolMatches = await resp.json();
                    return geneSymbolMatches.hits;
                } else {
                    throw new Error(
                        `MyGene Info returning non-successful code ${resp.status}`
                    );
                }
            })
            .then((json) => {
                this.rawGeneInfo = json;
            })
            .catch((error) => console.error(error));
    },
    methods: {
        supportedPrefix: trapi.identifiers.supportedPrefix,
        geneInfoForField(geneInfo, field) {
            const helpers = {
                aggregateNestedLists: function (elements) {
                    const element = elements.flatMap((element) =>
                        Object.entries(element)
                            .filter((element) => element[1].length > 0)
                            .flatMap((thisEntry) =>
                                thisEntry[1].map((entry) => {
                                    entry["source"] = thisEntry[0];
                                    return entry;
                                })
                            )
                    );
                    return element;
                },
            };
            return jsonQuery(`geneInfo[${field}]:aggregateNestedLists`, {
                data: {
                    geneInfo,
                },
                allowRegexp: true,
                locals: helpers,
            }).value;
        },
        mungedOptions(items, attribute) {
            return items
                .map((row) => row[attribute])
                .filter((el) => el !== undefined)
                .flatMap((id) => id);
        },
        formatCell(cellValue) {
            if (typeof cellValue === "string") {
                return cellValue.replace(/_/g, " ");
            } else {
                return cellValue;
            }
        },
        onFiltered(filteredItems) {
            // Trigger pagination to update the number of buttons/pages due to filtering
            this.totalRows = filteredItems.length;
            this.currentPage = 1;
        },
        getPubmedArray(item){
            if (typeof item.pubmed === "number"){
                return [item.pubmed];
            }
            return item.pubmed;
        }
    },
});
</script>
