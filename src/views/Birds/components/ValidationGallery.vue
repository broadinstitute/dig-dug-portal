<template>
    <div id="validationView" class="validationView" aria-live="polite">
      <method-heading :method="method"></method-heading>
      <div class="panelSection validationSection">
        <h3>5. Validation</h3>
        <div class="validationGallery" role="group" :aria-label="title + ' figures'">
          <section v-for="figure in config.figures" :key="figure.src" class="validationFigurePanel">
            <h3 class="validationFigureHeading">{{ figure.heading }}</h3>
            <div class="validationFigureStage"><img :src="figure.src" :alt="figure.alt"></div>
            <div class="validationDescription"><p>{{ figure.description }}</p></div>
          </section>
        </div>
      </div>
    </div>
</template>
<script>
import Vue from "vue";
import MethodHeading from "./MethodHeading.vue";
import { BirdValidationData } from "../content/validation.js";

export default Vue.component("validation-gallery", {
  components: {
    MethodHeading
  },
  props: { method: { type: String, required: true } },
  computed: {
    config() { return BirdValidationData[this.method]; },
    title() { return this.config.name + ' validation'; }
  },
});
</script>
<style>
@import url("/css/birdcss/revisions.css");
@import url("/css/birdcss/style.css");
</style>