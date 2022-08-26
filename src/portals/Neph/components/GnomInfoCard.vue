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
                    <csv-download
                        v-if="tableData.length"
                        :data="tableData"
                        filename="gnomAD-info"
                    ></csv-download
                ></b-col>
            </b-row>
            <div v-show="tableData.length">
                <b-table
                    id="gnomad"
                    hover
                    small
                    sort-icon-left
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
import { match, query } from "@/utils/bioIndexUtils";

export default Vue.component("GnominfoCard", {
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
                },
                {
                    key: "AN",
                    label: "Allele Number",
                },
                {
                    key: "AF",
                    label: "Allele Frequency",
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
            if (this.gnomAD_info && this.gnomAD_info.length) {
                return this.gnomAD_info;
            } else {
                return [];
            }
            /*let dataRows = this.variant.hprecords;
            if (!!this.filter) {
                dataRows = dataRows.filter((association) => {
                    return this.filter(association);
                });
            }
            return dataRows;*/
        },
    },
    created() {
        if (this.variantId) {
            this.searchVariants();
        }
    },
    methods: {
        async searchVariants() {
            //alert("variant id:" + this.variantId);
            //console.log("variant id:" + this.variantId);
            let varinfo = this.variantId.split(":");
            let searchquery = varinfo[0] + ":" + varinfo[1];
            this.variant = await query("variants", searchquery, {}, true);
            let gnomdisplay = [];
            //alert("gnomAD_info:"+this.variant.length);
            //for (var k in this.variant[0].gnomAD_info) {
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

            //console.log("results:"+JSON.stringify(this.variant[0].hprecords));
        },
        // formatAlleleFrequency(count, number) {
        //     if (count === 0 || number === 0) return 0;
        //     else return Number.parseFloat(count / number).toExponential(2);
        // }
    },
});
</script>
