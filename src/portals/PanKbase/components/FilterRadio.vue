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
    :valueCleared="valueCleared"
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
      default: (item, threshold) => item === threshold,
    },
    filtersActive: {
      type: Array,
      default: []
    }
  },
  components: {
    FilterRadioTemplate,
  },
  computed: {
    dedupedOptions(){
      return Array.from(new Set(this.options));
    },
    valueCleared(){
      return !this.filtersActive.includes(this.field);
    }
  }
});
</script>
