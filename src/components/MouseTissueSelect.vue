<template>
  <select v-model="tissue" class="form-control">
      
  </select>
</template>

<script>
import Vue from "vue";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import keyParams from "@/utils/keyParams";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

export default Vue.component("geneset-size-selectpicker", {
  props: [],
  data() {
      return {
          tissue: keyParams.tissue || "",
          tissueKeys: [],
      };
  },
  computed: {
      keyParamsTissue() {
          return keyParams.tissue;
      },
      tissueKeys(){

      }
  },
  methods: {
    async getTissueKeys() {
			let tissues = await fetch(`${BIO_INDEX_HOST}/api/bio/keys/diff-exp/2?columns=tissue`)
				.then(resp => resp.json())
				.then(json => {
					if (json.count == 0) {
						return null;
					}
					return json.keys.map(key => key[0])
				});
            context.state.tissueKeys = tissues;
		},
  },
  watch: {
      size(newSize) {
          this.$store.state.genesetSizeToQuery = newSize;
          this.$emit("onGenesetSizeChange", newSize);
      },
      keyParamsSize(newKey) {
          if (this.size === null) {
              this.size = newKey;
          }
      },
  },
});
</script>
