<template>
  <div>
    <div
			v-html="'Total rows: ' + items.length"
			class="table-total-rows"
		></div>
    <b-table
      small
      :items="items"
      :fields="diffExpFields"
      :per-page="perPage"
      :current-page="currentPage"
      >
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
  export default Vue.component("mouse-diff-exp-table", {
    props: ["items"],
    data() {
      return {
        perPage: 10,
        currentPage: 1,
        diffExpFields: [
          {
              key: "founder_sex",
              label: "Founder * sex",
              sortable: true
          },
          {
              key: "founder",
              label: "Founder",
              sortable: true
          },
          {
              key: "sex",
              label: "Sex",
              sortable: true
          },
          {
              key: "expression",
              label: "Gene expression",
              sortable: true
          }
        ]
      } 
    },
    methods: {
    }
  });
</script>
<style scoped>
@import url("/css/table.css");
</style>