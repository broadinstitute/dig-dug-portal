<template>
    <div class="center">
        <b-table-simple borderless fixed small>
            <b-tbody>
                <b-tr>
                    <b-th>&nbsp;</b-th><b-th>Exome</b-th><b-th>Genome</b-th><b-th>Total</b-th>
                </b-tr>
                <b-tr>
                    <b-td>Filters</b-td><b-td></b-td><b-td></b-td><b-td></b-td>
                </b-tr>
                <b-tr>
                    <b-td>Allele Count</b-td><b-td></b-td><b-td></b-td><b-td></b-td>
                </b-tr>
                <b-tr>
                    <b-td>Allele Number</b-td><b-td></b-td><b-td></b-td><b-td></b-td>
                </b-tr>
                <b-tr>
                    <b-td>Allele Frequency</b-td><b-td></b-td><b-td></b-td><b-td></b-td>
                </b-tr>
                <b-tr>
                    <b-td>Popmax Filtering AF More information<br/>(95% confidence)</b-td><b-td></b-td><b-td></b-td><b-td></b-td>
                </b-tr>
                <b-tr>
                    <b-td>Number of homozygotes</b-td><b-td></b-td><b-td></b-td><b-td></b-td>
                </b-tr>
                <b-tr>
                    <b-td>Mean depth of coverage</b-td><b-td></b-td><b-td></b-td><b-td></b-td>
                </b-tr>
            </b-tbody>
        </b-table-simple>
    </div>
</template>

<script>
import Vue from "vue";
import Formatters from "@/utils/formatters";
import { match, query } from "@/utils/bioIndexUtils";

export default Vue.component("gnominfo-card", {
    props: ["variantId"],
    data() {
    },
    created() {
		if (this.variantId) {
			this.searchVariants();
		}
	},
    computed: {
        rows() {
            return this.tableData.length;
        },
        tableData() {
            if (this.gnomAD_info && this.gnomAD_info.length) {
                console.log("here:"+this.gnomAD_info);
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
})

</script>