<template>
  <div class="col filter-col-md">
    <div class="label">Tissue</div>
    <select v-model="tissue" class="form-control">
      <option value="">Select tissue</option>
      <option v-for="tissue in tissueKeys" 
        :value="tissue">
          {{ tissue }}
      </option>
    </select>
  </div>
</template>

<script>
import keyParams from "@/utils/keyParams";

export default {
  name: "mouse-tissue-select",
  props: [],
  emits: ["onTissueChange"],
  data() {
      return {
          tissue: keyParams.tissue || "",
      };
  },
  created(){
    if (this.$store.state.tissueKeys.length === 0){
      this.$store.dispatch("getTissueKeys");
    }
  },
  computed: {
      keyParamsTissue() {
          return keyParams.tissue;
      },
      tissueKeys(){
        return this.$store.state.tissueKeys || [];
      }
  },
  watch: {
      tissue(newTissue) {
          this.$store.state.tissueToQuery = newTissue;
          this.$emit("onTissueChange", newTissue);
      },
      keyParamsTissue(newKey) {
          if (this.tissue === null) {
              this.tissue = newKey;
          }
      },
  },
};
</script>
