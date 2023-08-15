<template>
    <div>
        <div v-if="eglsList.length > 0" class="col-md-12 col">
            <div class="row egls-list-header">
                <div class="col-md-4">Name</div>
                <div class="col-md-4">Reference</div>
                <div class="col-md-2">PMID</div>
                <div class="col-md-2">View Genes</div>
            </div>
            <div v-for="item in eglsList" class="row egls-list">
                <div class="col-md-4" v-html="item['Effector list name']"></div>
                <div
                    class="col-md-4"
                    v-html="item['Title'] + '. ' + item['Citation']"
                ></div>
                <div
                    class="col-md-2"
                    v-html="
                        item['PMID'] != 'undefined' &&
                        item['PMID'] != undefined &&
                        item['PMID'] != ''
                            ? '<a target=\'_blank\'href=\'https://pubmed.ncbi.nlm.nih.gov/' +
                              item['PMID'] +
                              '\'>' +
                              item['PMID'] +
                              '</a>'
                            : ''
                    "
                ></div>
                <div
                    class="col-md-2"
                    v-html="
                        item['Page ID'] != 'undefined' &&
                        item['Page ID'] != undefined &&
                        item['Page ID'] != ''
                            ? '<a class=\'btn btn-sm btn-primary view-genes\' target=\'_blank\'href=\'\\research.html?pageid=' +
                              item['Page ID'] +
                              '\' style=\'color: #ffffff !important;\'>View genes</a>'
                            : ''
                    "
                ></div>
            </div>
        </div>
        <div
            v-else
            class="well well-warning"
            style="background-color: #ff000050"
        >
            No predicted effector genes list found associated with
            {{ phenotype.description }}.
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import dataConvert from "@/utils/dataConvert";

export default Vue.component("EglsSection", {
    components: {},
    props: ["phenotype"],
    data() {
        return {
            eglsList: [],
        };
    },
    computed: {
        phenotypeName() {
            return this.phenotype.name;
        },
    },
    watch: {
        phenotypeName(NAME) {
            this.loadEglsList();
        },
    },
    created() {
        this.loadEglsList();
    },
    methods: {
        async loadEglsList() {
            let dataPoint =
                "https://hugeampkpncms.org/rest/data?pageid=egl_241";

            let contJson = await fetch(dataPoint).then((resp) => resp.json());

            if (contJson.error == null) {
                //console.log(contJson[0]["field_data_points"]);
                let data = dataConvert.csv2Json(
                    contJson[0]["field_data_points"]
                );

                let eglList = [];

                data.map((e) => {
                    //console.log(e);
                    if (
                        !!e["Trait ID"] &&
                        !!e["Trait ID"].includes(this.phenotype.name)
                    ) {
                        eglList.push(e);
                    }
                });
                //console.log("json data", eglList);
                this.eglsList = eglList;
            }
        },
    },
});
</script>
<style scoped>
.egls-list-header {
    font-weight: bold;
    border-top: solid 2px #ddd;
    border-bottom: solid 1px #ddd;
    padding: 7px 0;
}
.egls-list {
    border-top: solid 1px #ddd;
    margin-bottom: 7px;
    padding-top: 7px;
}
.well.well-warning {
    padding: 15px;
    border-radius: 15px;
}
</style>
