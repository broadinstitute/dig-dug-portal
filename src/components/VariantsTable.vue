<template>
  <div>
    <b-table hover :items="variants" :fields="fields" :tbody-tr-class="rowClass"></b-table>
  </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("variants-table", {
  props: ["variants"],
  data() {
    return {
      // Note `isActive` is left out and will not appear in the rendered table
      fields: [{
        key:'VAR_ID',
        label: 'Variant ID',
        sortable: false
      },
      {
        key:'DBSNP_ID',
        label: 'dbSNP ID',
        sortable: false
      },
      {
        key:'P_VALUE',
        label: 'p-value',
        sortable: true
      },
      {
        key:'Reference_allele',
        label: 'Major allele',
        sortable: true
      },
      {
        key:'Effect_allele',
        label: 'Minor allele',
        sortable: true
      },
      {
        key:'Consequence',
        label: 'Predicted impact',
        sortable: true
      },
      {
        key:'EFFECT',
        label: 'Effect',
        sortable: true
      },
      {
        key:'AF',
        label: 'MAF',
        sortable: true
      }
      ],
    }
  },
  methods: {
      rowClass(item, type) {
        if (!item || type !== 'row') return;
        if (item.P_VALUE < 2.5e-6) return 'variant-table-row';
      }
    }
});
</script>
