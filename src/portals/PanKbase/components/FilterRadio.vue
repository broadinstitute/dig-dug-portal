<template>
  <filter-radio-template
    class="filter-col-md"
    :field="field"
    :predicate="predicate"
    :options="dedupedOptions"
    @input-change="$emit('input-change', $event)"
    :color="color"
    :multiple="false"
    :inclusive="false"
    :presets="presets"
  >
    <slot> </slot>
  </filter-radio-template>
</template>
<script>
import Vue from "vue";
import FilterRadioTemplate from "./FilterRadioTemplate.vue";
export default Vue.component("filter-radio", {
  props: {
    field: String,
    options: Array,
    color: String,
    predicate: {
      type: Function,
      default: (item, thresholdArray) => thresholdArray.includes(item),
    },
    presets: Array

  },
  mounted(){
    console.log(JSON.stringify(this.presets));
  },
  components: {
    FilterRadioTemplate,
  },
  computed: {
    dedupedOptions(){
      let allOptions = Array.from(new Set(this.options));
      let emptyValue = "-";
      // Put the empty/ Not Applicable value last if it is present
      if (allOptions.includes(emptyValue)){
        allOptions = allOptions.filter(o => o !== emptyValue).concat([emptyValue]);
      }
      return allOptions;
    },
  }
});
</script>
