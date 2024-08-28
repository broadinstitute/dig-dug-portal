<template>
  <div>
    <b-table
      small
      :items="items"
      :fields="fields"
      :sort-by="!isGenePage ? 'gene' : 'tissue'"
      :per-page="perPage"
      :current-page="currentPage"
    >
      <template #cell(gene)="row">
        <a :href="`/gene.html?gene=${row.item.gene}`">
              {{ row.item.gene }}
        </a>
      </template>
      <template #cell(gene_region)="row">
        {{ `${row.item.chromosome}:${row.item.start}-${row.item.end}` }}
      </template>
    </b-table>
    <b-pagination
      v-model="currentPage"
      class="pagination-sm justify-content-center"
      :total-rows="items.length"
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
  export default Vue.component("MouseSummaryTable", {
    props: ["items", "isGenePage"],
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
            label: "Adjusted p-value: strain + sex",
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
      }
    }
  });
</script>