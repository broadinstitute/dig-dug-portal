<template>
    <div>
        <div class="text-right mt-2 mb-2">
            <data-download
                :data="tableData"
                filename="UniProt_table"
            ></data-download>
        </div>
        <b-table
            hover
            small
            responsive="sm"
            :items="tableData"
            :fields="fields"
            :per-page="perPage"
            :current-page="currentPage"
        >
            <!-- <template #cell(id)="data">
                <div v-if="!!context[remap(data.item.source)]">
                    <resolved-curie-link
                        :id="data.item.id"
                        :prefix="remap(data.item.source)"
                    ></resolved-curie-link>
                </div>
                <div v-else>
                    <resolved-curie-link
                        :curie="data.item.id">
                    </resolved-curie-link>
                </div>
            </template> -->

            <template #cell(gene)="v">
                <a :href="'/gene.html?gene=' + v.item.gene_id">{{
                    v.item.gene_id
                }}</a>
            </template>
        </b-table>
        <b-pagination
            v-model="currentPage"
            class="pagination-sm justify-content-center"
            :total-rows="rows"
            :per-page="perPage"
        ></b-pagination>
    </div>
</template>

<script>
import Vue from "vue";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import DataDownload from "@/components/DataDownload";

export default Vue.component("UniprotReferencesTable", {
    components: {
        DataDownload,
    },
    props: ["references", "filter"],
    data() {
        return {
            fields: [
                {
                    key: "id",
                    label: "ID",
                },
                {
                    key: "source",
                    label: "Source",
                },
                {
                    key: "moleculeType",
                    label: "Molecule Type",
                },
                {
                    key: "proteinSeqID",
                    label: "Protein Sequence ID",
                },
            ],
            perPage: 5,
            currentPage: 1,
            source: "",
            moleculeType: "",
            context: null,
        };
    },
    computed: {
        rows() {
            return this.tableData.length;
        },
        tableData() {
            let dataRows = this.references;
            if (this.filter) {
                dataRows = dataRows.filter(this.filter);
            }
            return dataRows;
        },
    },
    async created() {
        this.context = await fetch(
            "https://raw.githubusercontent.com/biolink/biolink-model/master/project/jsonld/biolink_model.context.jsonld"
        )
            .then((response) => response.json())
            .then((json) => json["@context"]);
    },
    methods: {
        // remap(prefix) {
        //     const remapping = {
        //         'reactome': 'REACT',
        //         'wikipathways': 'WIKIPATHWAYS'
        //     }
        //     if (!!remapping[prefix]) {
        //         return remapping[prefix];
        //     }
        //     return prefix;
        // },
        clearFilter(obj) {
            this[obj] = "";
        },
    },
});
</script>
