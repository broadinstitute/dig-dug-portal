<template>
  <div>
    <div v-if="rows > 0">
      <div v-html="'Total rows: ' + rows"
        class="table-total-rows"
      ></div>
      <div class="text-right mb-2">
          <data-download :data="items" :filename="`mouse_summary_${pageParam}`">
          </data-download>
      </div>
    </div>
    <b-table
      small
      :items="filteredData"
      :fields="fields"
      :sort-by="!isGenePage ? 'gene' : 'tissue'"
      :per-page="perPage"
      :current-page="currentPage"
      :sort-compare="sortRows"
    >
      <template #cell(tissue)="row">
        <a :href="`/mouse_diff_exp.html?gene=${row.item.gene}&tissue=${row.item.tissue}`">
              {{ row.item.tissue }}
        </a>
      </template>
      <template #cell(gene)="row">
        <a :href="`/mouse_diff_exp.html?gene=${row.item.gene}&tissue=${row.item.tissue}`">
              {{ row.item.gene }}
        </a>
      </template>
      <template #cell(gene_id)="row">
        <a :href="`https://useast.ensembl.org/Mus_musculus/Gene/Summary?db=core;g=${row.item.gene_id}`">
          {{ row.item.gene_id }}
        </a>
      </template>
      <template #cell(gene_region)="row">
        {{ `${row.item.chromosome}:${row.item.start}-${row.item.end}` }}
      </template>
    </b-table>
    <b-pagination
      v-model="currentPage"
      class="pagination-sm justify-content-center"
      :total-rows="rows"
      :per-page="perPage"
    >
    </b-pagination>
  </div>
</template>
<style scoped>
  @import url("/css/table.css");
</style>
<script>
  import Vue from "vue";
  import DataDownload from "@/components/DataDownload.vue";
  export default Vue.component("MouseSummaryTable", {
    components: {
        DataDownload,
    },
    props: ["items", "isGenePage", "filter"],
    data() {
      return {
        perPage: 10,
        currentPage: 1,
        commonFields: [
          {
            key: "P_adj_sex",
            label: "Adjusted p-value: sex",
            sortable: true
          },
          {
            key: "P_adj_strain",
            label: "Adjusted p-value: strain",
            sortable: true
          },
          {
            key: "P_adj_strain_sex",
            label: "Adjusted p-value: strain and sex",
            sortable: true
          }
        ],
        tissueOnlyFields: [
          {
            key: "gene",
            label: "Gene",
            sortable: true
          },
          {
            key: "gene_id",
            label: "Gene ID",
            sortable: true
          },
          {
            key: "gene_region",
            label: "Gene region",
            sortable: true
          }
        ],
        geneOnlyFields: [
          {
            key: "tissue",
            label: "Tissue",
            sortable: true
          },
        ]
      } 
    },
    computed: {
      fields(){
        let specificFields = !this.isGenePage ? this.tissueOnlyFields : this.geneOnlyFields;
        return specificFields.concat(this.commonFields);
      },
      pageParam(){
        let field = !this.isGenePage ? "tissue" : "gene";
        return this.items[0]?.[field] || '';
      },
      filteredData(){
        let data = structuredClone(this.items);
        if (!!this.filter){
          data = data.filter(this.filter);
        }
        return data;
      },
      rows(){
        return this.filteredData.length;
      }
    },
    methods: {
      sortRows(aRow, bRow, key){
        let a = aRow[key];
        let b = bRow[key];

        if (key === 'gene_region'){
          return this.compareRegions(aRow, bRow); 
        }

        if (typeof a === 'number' && typeof b === 'number'){
          return a < b ? -1 : a > b ? 1 : 0;
        }

        return String(a).localeCompare(String(b));

      },
      compareRegions(aRow, bRow){
        let aChr = aRow.chromosome;
        let bChr = bRow.chromosome;
        let chrCompare = aChr.localeCompare(bChr, undefined, {numeric: true});
        if (chrCompare !== 0){
          return chrCompare;
        } 
        let aStart = aRow.start;
        let bStart = bRow.start;
        return aStart < bStart ? -1 : aStart > bStart ? 1 : 0;

      }
    }
  });
</script>