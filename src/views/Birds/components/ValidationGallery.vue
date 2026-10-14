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

export default Vue.component("validation-gallery", {
  props: { method: { type: String, required: true } },
  computed: {
    config() { return window.BirdValidationData[this.method]; },
    title() { return this.config.name + ' validation'; }
  },
});
</script>

