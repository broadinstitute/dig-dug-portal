<template>
    <div>
        <div v-if="rows > 0">
            <b-row>
                <b-col class="text-right mb-2">
                    <b-button
                        class="mr-1 text-white"
                        target="_blank"
                        :href="`https://gnomad.broadinstitute.org/variant/${variantId}`"
                        size="sm"
                        >View in gnomAD browser</b-button
                    >
                    <data-download
                        v-if="tableData.length"
                        :data="tableData"
                        filename="gnomAD-info"
                    ></data-download
                ></b-col>
            </b-row>
            <div v-show="tableData.length">
                <b-table
                    id="gnomad"
                    hover
                    small
                    responsive="sm"
                    :items="tableData"
                    :fields="fields"
                >
                </b-table>
            </div>
        </div>
        <div v-else>
            <b-alert show variant="warning" class="text-center">
                <b-icon icon="exclamation-triangle"></b-icon> No gnomAD
                information found.</b-alert
            >
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import Formatters from "@/utils/formatters";
import DataDownload from "@/components/DataDownload";
import { match, query } from "@/utils/bioIndexUtils";

export default Vue.component("GnominfoCard", {
    components: {
        DataDownload,
    },
    props: ["variantId"],
    data() {
        return {
            InfoFields: {
                AFR: "African/African American",
                AMR: "Amerindian",
                ASJ: "Ashkenazi Jewish",
                EAS: "East Asian",
                FIN: "European (Finnish)",
                NFE: "European (Non-Finnish)",
                SAS: "South Asian",
                OTH: "Other",
            },
            fields: [
                {
                    key: "name",
                    label: "Population",
                },
                {
                    key: "AC",
                    label: "Allele Count",
                    sortable: true,
                    tdClass: "text-right pr-3",
                    thClass: "text-right",
                },
                {
                    key: "AN",
                    label: "Allele Number",
                    sortable: true,
                    tdClass: "text-right pr-3",
                    thClass: "text-right",
                },
                {
                    key: "AF",
                    label: "Allele Frequency",
                    sortable: true,
                    tdClass: "text-left pl-5",
                    thClass: "text-left pl-5",
                },
            ],
            gnomAD_info: [],
            variant: [],
        };
    },
    computed: {
        rows() {
            return this.tableData.length;
        },
        tableData() {
            return this.gnomAD_info || [];
        },
    },
    created() {
        if (this.variantId) {
            this.searchVariants();
        }
    },
    methods: {
        async searchVariants() {
            let varinfo = this.variantId.split(":");
            let searchquery = varinfo[0] + ":" + varinfo[1];
            this.variant = await query("variants", searchquery, {}, true);
            let gnomdisplay = [];

            gnomdisplay[0] = {
                name: "Total",
                AC: this.variant[0].gnomAD_info?.gnomADg_AC || "",
                AF: this.variant[0].gnomAD_info?.gnomADg_AF || "",
                AN: this.variant[0].gnomAD_info?.gnomADg_AN || "",
            };

            let j = 1;
            for (let k in this.InfoFields) {
                if (this.InfoFields[k] != undefined) {
                    gnomdisplay[j] = {
                        name: this.InfoFields[k],
                        AC: this.variant[0].gnomAD_info?.["gnomADg_AC_" + k],
                        AF: this.variant[0].gnomAD_info?.["gnomADg_AF_" + k],
                        AN: this.variant[0].gnomAD_info?.["gnomADg_AN_" + k],
                    };
                    j++;
                }
            }

            this.gnomAD_info = gnomdisplay;
        },
    },
});
</script>
