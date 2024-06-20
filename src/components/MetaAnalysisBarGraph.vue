<template>
  <div>
      <h5>Meta-analysis types</h5>
      <table>
        <tr class="bottom-line">
          <th scope="row">bottom-line</th>
          <td></td>
          <td></td>
          <td>1,303</td>
        </tr>
        <tr class="min-p">
          <th scope="row">min_p</th>
          <td></td>
          <td></td>
          <td>1,200</td>
        </tr>
        <tr class="largest">
          <th scope="row">largest</th>
          <td></td>
          <td></td>
          <td>1,096</td>
        </tr>
        <tr class="thin-bar">
          <th scope="row"></th>
          <td></td>
          <td></td>
          <td></td>
        </tr>
        <tr class="summary">
          <th scope="row"></th>
          <td>103</td>
          <td>104</td>
          <td>1,096</td>
        </tr>
      </table>
  </div>
</template>

<script>
import Vue from "vue";

import { BootstrapVue, IconsPlugin } from "bootstrap-vue";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import uiUtils from "@/utils/uiUtils";

export default Vue.component("meta-analysis-bar-graph", {
  props: ["filter"],
  data() {
      return {
        width: 400
      };
  },
  methods: {
  }
});
</script>
<style scoped>
  .bottom-line td {
    background-color: #6dcff6;
  }
  .min-p td {
    background-color: #f49ac1;
  }
  .largest td {
    background-color: #fff200;
  }
</style>